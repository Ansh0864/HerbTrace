import json
import io
import qrcode
import os
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from web3 import Web3
import google.generativeai as genai
import time
from dotenv import load_dotenv

# Automatically find and load the .env file
load_dotenv()

# --- AI Model Imports ---
import tensorflow as tf
import numpy as np

# --- Gemini API Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_API_KEY_HERE")
# Inside main.py, near line 21
genai.configure(api_key=GEMINI_API_KEY)

# PASTE DIAGNOSTIC CODE HERE:
print("--- API Model Check ---")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"Available: {m.name}")
print("-----------------------")

llm_model = genai.GenerativeModel('gemini-2.5-flash')

# --- Load the AI model and define class names ---
try:
    model = tf.keras.models.load_model('herb_classifier.h5')
    print("AI model 'herb_classifier.h5' loaded successfully! ")

    class_names = [
        'Nooni', 'Nithyapushpa', 'Basale', 'Pomegranate', 'Honge', 'Lemon_grass', 'Mint', 'Betel_Nut', 'Nagadali',
        'Curry_Leaf', 'Jasmine', 'Castor', 'Sapota', 'Neem', 'Ashoka', 'Brahmi', 'Amruta_Balli', 'Pappaya', 'Pepper',
        'Wood_sorel', 'Gauva', 'Hibiscus', 'Ashwagandha', 'Aloevera', 'Raktachandini', 'Insulin', 'Bamboo', 'Amla', 'Arali',
        'Geranium', 'Avacado', 'Lemon', 'Ekka', 'Betel', 'Henna', 'Doddapatre', 'Rose', 'Mango', 'Tulasi', 'Ganike'
    ]
except (IOError, ImportError) as e:
    print(f"Error loading AI model: {e}")
    model = None

# --- Function to preprocess the image ---
def preprocess_image(file_content: bytes, target_size=(224, 224)):
    image = Image.open(io.BytesIO(file_content)).convert('RGB')
    image = image.resize(target_size)
    image_array = np.array(image) / 255.0
    return np.expand_dims(image_array, axis=0)

# --- Blockchain Setup ---
ganache_url = "http://127.0.0.1:7545"
web3 = Web3(Web3.HTTPProvider(ganache_url))

try:
    with open("contract_details.json", "r") as f:
        contract_details = json.load(f)
    contract_address = contract_details["address"]
    contract_abi = contract_details["abi"]
    AyurTraceContract = web3.eth.contract(address=contract_address, abi=contract_abi)
    print("Smart contract loaded successfully! ")
except FileNotFoundError:
    print("Contract details not found. Please run blockchain_utils.py first.")
    AyurTraceContract = None

# --- FastAPI Application ---
app = FastAPI()

origins = ["http://localhost", "http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoint 1: Herb Traceability Submission (Farmer) ---
@app.post("/submit_herb/")
async def submit_herb(
    latitude: float = Form(...),
    longitude: float = Form(...),
    image_file: UploadFile = File(...)
):
    if not model:
        return {"status": "error", "message": "AI model is not loaded."}

    try:
        image_content = await image_file.read()
        processed_image = preprocess_image(image_content)
        prediction = model.predict(processed_image)

        confidence_score = float(np.max(prediction) * 100)
        predicted_index = np.argmax(prediction)
        ai_verified_species = class_names[predicted_index]

        if AyurTraceContract:
            account = web3.eth.accounts[0]
            tx_hash = AyurTraceContract.functions.addHerb(
                ai_verified_species,
                int(confidence_score),
                int(latitude * 1e6),
                int(longitude * 1e6)
            ).transact({'from': account})

            receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Robust event processing
            event_logs = AyurTraceContract.events.HerbAdded().process_receipt(receipt)
            
            if event_logs:
                herb_id = event_logs[0]['args']['id']
            else:
                # Fallback to get ID if event parsing fails
                herb_id = AyurTraceContract.functions.herbCount().call() - 1

            return {
                "status": "success",
                "herb_id": int(herb_id),
                "ai_result": {
                    "verified_species": ai_verified_species,
                    "confidence": f"{confidence_score:.2f}%"
                }
            }
        else:
            return {"status": "error", "message": "Smart contract not deployed."}

    except Exception as e:
        return {"status": "error", "message": f"An error occurred: {str(e)}"}

# --- Endpoint 2: QR Code Generation ---
@app.get("/generate_qr/{herb_id}")
async def generate_qr_code(herb_id: int):
    try:
        qr_data = f"http://127.0.0.1:5173/trace/{herb_id}"
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        return Response(content=buffer.getvalue(), media_type="image/png")
    except Exception as e:
        return {"status": "error", "message": f"An error occurred while generating QR code: {e}"}

# --- Endpoint 3: Processor Updates ---
@app.post("/process_herb/{herb_id}")
async def process_herb(herb_id: int, action: str = Form(...)):
    if not AyurTraceContract:
        return {"status": "error", "message": "Smart contract not deployed."}

    try:
        processor_account = web3.eth.accounts[1]
        PROCESSOR_ROLE = Web3.keccak(text="PROCESSOR_ROLE")
        has_role = AyurTraceContract.functions.hasRole(PROCESSOR_ROLE, processor_account).call()
        
        if not has_role:
            admin_account = web3.eth.accounts[0]
            tx_hash_grant = AyurTraceContract.functions.addProcessor(processor_account).transact({'from': admin_account})
            web3.eth.wait_for_transaction_receipt(tx_hash_grant)

        batch_number = f"BATCH-{herb_id}-{int(time.time())}"
        tx_hash = AyurTraceContract.functions.addProcessingStep(herb_id, action, batch_number).transact({'from': processor_account})
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "status": "success",
            "message": "Processing step added to blockchain.",
            "herb_id": herb_id,
            "action": action,
            "batch_number": batch_number,
            "transaction_hash": receipt.transactionHash.hex()
        }
    except Exception as e:
        return {"status": "error", "message": f"An error occurred: {e}"}

# --- Endpoint 4: General Dashboard ---
@app.get("/dashboard/")
async def get_dashboard_data():
    if not AyurTraceContract:
        return {"status": "error", "message": "Smart contract not deployed."}

    try:
        herb_count = AyurTraceContract.functions.herbCount().call()
        records = []
        for i in range(herb_count):
            record = AyurTraceContract.functions.herbEntries(i).call()
            records.append({
                "id": i,
                "name": record[0],
                "confidence_score": record[1],
                "latitude": record[2] / 1e6,
                "longitude": record[3] / 1e6,
                "timestamp": record[4],
                "farmer": record[5]
            })
        return {"status": "success", "data": records}
    except Exception as e:
        return {"status": "error", "message": f"An error occurred: {e}"}

# --- Endpoint 5: Consumer Traceability ---
@app.get("/trace_herb/{herb_id}")
async def trace_herb(herb_id: int):
    if not AyurTraceContract:
        return {"status": "error", "message": "Smart contract not deployed."}

    try:
        herb_data = AyurTraceContract.functions.herbEntries(herb_id).call()
        if not herb_data or not herb_data[0]:
            return {"status": "error", "message": "Herb ID not found."}

        origin_details = {
            "name": herb_data[0],
            "confidenceScore": herb_data[1],
            "latitude": herb_data[2] / 1e6,
            "longitude": herb_data[3] / 1e6,
            "timestamp": herb_data[4],
            "farmer": herb_data[5]
        }

        history_data = AyurTraceContract.functions.getProcessingHistory(herb_id).call()
        processing_history = []
        for step in history_data:
            processing_history.append({
                "action": step[0],
                "batchNumber": step[1],
                "timestamp": step[2],
                "processor": step[3]
            })

        return {
            "status": "success",
            "data": {"origin": origin_details, "processingHistory": processing_history}
        }
    except Exception as e:
        return {"status": "error", "message": f"An error occurred while tracing herb: {e}"}

# --- Endpoint 6: Farmer Advice ---
@app.post("/farmer_advice/")
async def farmer_advice(
    query: str = Form(...),
    herb_name: str = Form(None), 
    location_name: str = Form("India")
):
    try:
        prompt = f"""
        Role: Ayurvedic herbalist in {location_name}.
        Question: {query}
        Context: If a specific herb isn't named in the query, identify the most likely herb or provide general principles.
        Task: Provide practical advice on cultivation, pests, and harvesting.
        """
        response = llm_model.generate_content(prompt)
        return {"status": "success", "response": response.text}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# --- Endpoint 7: Consumer Chat (Gemini API) ---
@app.post("/consumer_chat/")
async def consumer_chat(
    query: str = Form(...),
    herb_name: str = Form(None)
):
    try:
        # Construct a clear prompt for the AI
        prompt = f"As an Ayurvedic expert, answer the following query: {query}"
        if herb_name:
            prompt += f" specifically regarding the herb {herb_name}."
            
        response = llm_model.generate_content(prompt)
        
        # Ensure the response is returned as text
        return {"status": "success", "response": response.text}
    except Exception as e:
        return {"status": "error", "message": f"AI Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)