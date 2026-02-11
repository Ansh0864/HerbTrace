import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaCamera, FaUpload, FaMapMarkerAlt, FaCheckCircle, FaSpinner, FaTimes, FaEdit, FaQrcode } from "react-icons/fa";

function HerbForm({ colors = {}, userRole }) {
  const primaryGreen = colors.primaryGreen || "#4a7c59";
  const goldTan = colors.goldTan || "#a87f4f";
  const lightGrey = colors.lightGrey || "#f0f4f7";

  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [identificationResult, setIdentificationResult] = useState(null);
  const [editedHerbName, setEditedHerbName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [herbId, setHerbId] = useState(null); // New state for herb ID

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    setImage(null);
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsCameraActive(true);
    } catch (err) {
      setError("Could not access camera. Please allow camera permissions.");
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const photo = canvasRef.current.toDataURL("image/png");
      setImage(photo);
      stopCamera();
    }
  };

  const handleImageUpload = (e) => {
    setError("");
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const identifyAndSubmit = async () => {

    // Check if user is Producer
    if (userRole !== "Producer") {
      setError("Only authorized Producers can submit herb data.");
      setLoading(false);
      return;
    }

    if (!image) {
      setError("Please take a photo or upload an image first.");
      setLoading(false);
      return;
    }

    try {
      // Dynamic location retrieval
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const locationData = { lat: position.coords.latitude, lng: position.coords.longitude };
      setLocation(locationData);

      const imageBlob = await fetch(image).then(res => res.blob());
      const file = new File([imageBlob], "herb_image.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("image_file", file);
      formData.append("latitude", locationData.lat);
      formData.append("longitude", locationData.lng);

      // Backend API call
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/submit_herb/`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status === "success") {
        setIdentificationResult({
          herb: data.ai_result.verified_species,
          confidence: parseFloat(data.ai_result.confidence),
        });
        setEditedHerbName(data.ai_result.verified_species);
        setHerbId(data.herb_id); // Store the herb ID

        // Generate dynamic QR Code
        const qrResponse = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/generate_qr/${data.herb_id}`);
        const qrBlob = await qrResponse.blob();
        setQrCodeUrl(URL.createObjectURL(qrBlob));

        setSubmissionStatus("success");
      } else {
        setError(data.message);
        setSubmissionStatus("error");
      }
    } catch (err) {
      setError(`An error occurred: ${err}`);
      setSubmissionStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleManualCorrection = async () => {
    setLoading(true);
    setError("");

    // Simulate sending the corrected name to a backend endpoint
    // For now, it will just show a success message
    try {
      setTimeout(() => {
        setSubmissionStatus("success");
        setLoading(false);
      }, 1000);
    } catch (e) {
      setError("Failed to save manual correction.");
      setLoading(false);
    }
  };

  const resetForm = () => {
    setImage(null);
    setLocation(null);
    setError("");
    setIdentificationResult(null);
    setEditedHerbName("");
    setSubmissionStatus(null);
    setQrCodeUrl(null);
    setHerbId(null);
  };

  return (
    <motion.div
      className="flex flex-col items-center justify-center p-8 min-h-[70vh]"
      style={{ backgroundColor: colors.background }}
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: primaryGreen }}>
          Herb Contribution
        </h1>
        {error && (
          <motion.div
            className="p-4 rounded-xl text-center font-medium bg-red-100 text-red-600 mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {submissionStatus === null && (
            <motion.div key="input" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="text-center">
              <h2 className="text-3xl font-semibold mb-4">Capture Herb Image</h2>
              <p className="mb-6 text-gray-600">
                Use your camera or upload a photo of the herb you are contributing.
              </p>
              <div className="flex flex-col items-center justify-center space-y-4">
                {image ? (
                  <div className="relative w-full max-w-xs">
                    <img src={image} alt="Herb" className="rounded-lg shadow-lg max-h-64 object-contain mx-auto" />
                    <button
                      onClick={() => setImage(null)}
                      className="absolute top-2 right-2 text-white bg-red-500 rounded-full p-1 hover:bg-red-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center" style={{ borderColor: lightGrey }}>
                    <div className="flex flex-col items-center text-gray-400">
                      <FaCamera size={48} />
                      <p className="mt-2 text-sm">No image captured or uploaded</p>
                    </div>
                  </div>
                )}
                <div className="flex space-x-4">
                  <button
                    onClick={startCamera}
                    className="flex items-center space-x-2 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200"
                    style={{ backgroundColor: primaryGreen }}
                  >
                    <FaCamera />
                    <span>Open Camera</span>
                  </button>
                  <label htmlFor="file-upload" className="flex items-center space-x-2 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 cursor-pointer" style={{ backgroundColor: goldTan }}>
                    <FaUpload />
                    <span>Upload Image</span>
                  </label>
                  <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
              {image && (
                <button
                  onClick={identifyAndSubmit}
                  className="mt-6 w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200"
                  style={{ backgroundColor: primaryGreen }}
                  disabled={loading}
                >
                  {loading ? <FaSpinner className="animate-spin mx-auto" /> : "Identify & Submit"}
                </button>
              )}
            </motion.div>
          )}

          {submissionStatus === "review" && (
            <motion.div key="review" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="text-center">
              <h2 className="text-3xl font-semibold mb-4">Confirm Details</h2>
              <p className="mb-6 text-gray-600">
                Please review the identified herb and location. You can manually correct the name if needed.
              </p>
              <div className="p-6 rounded-xl shadow-lg border-l-4 text-left" style={{ borderColor: primaryGreen, backgroundColor: lightGrey }}>
                <p className="font-bold">Herb Name:</p>
                <div className="flex items-center space-x-2 mt-1 mb-4">
                  <input
                    type="text"
                    value={editedHerbName}
                    onChange={(e) => setEditedHerbName(e.target.value)}
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: lightGrey, backgroundColor: 'white', color: primaryGreen }}
                  />
                  <FaEdit style={{ color: primaryGreen }} />
                </div>
                {location && (
                  <>
                    <p className="font-bold">Location:</p>
                    <p className="font-mono text-sm">{location.lat?.toFixed(4)}, {location.lng?.toFixed(4)}</p>
                  </>
                )}
                {identificationResult?.confidence && (
                  <p className="font-semibold text-sm text-gray-600 mt-2">
                    AI Confidence: <span style={{ color: primaryGreen }}>{identificationResult.confidence?.toFixed(2)}%</span>
                  </p>
                )}
                {image && <img src={image} alt="Review" className="mt-4 rounded-lg shadow-md max-h-48 object-contain" />}
              </div>
              <button
                onClick={handleManualCorrection}
                className="mt-6 w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200"
                style={{ backgroundColor: primaryGreen }}
                disabled={loading}
              >
                {loading ? <FaSpinner className="animate-spin mx-auto" /> : "Confirm and Finalize Submission"}
              </button>
              <button
                onClick={resetForm}
                className="mt-4 w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 bg-gray-300 text-gray-800 hover:bg-gray-400"
              >
                Start New Entry
              </button>
            </motion.div>
          )}

          {submissionStatus === "success" && (
            <motion.div key="success" initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="text-center">
              <h2 className="text-3xl font-semibold mb-4" style={{ color: primaryGreen }}>
                <FaCheckCircle className="inline-block mr-2" /> Submission Successful!
              </h2>
              <p className="text-gray-600">Your entry has been recorded on the blockchain.</p>
              <div className="mt-6 p-6 rounded-xl shadow-lg border-l-4 text-left" style={{ borderColor: primaryGreen, backgroundColor: lightGrey }}>
                <p><strong>Herb Name:</strong> {editedHerbName}</p>
                <p><strong>Herb ID:</strong> {herbId}</p> {/* Display the herb ID */}
                <p><strong>Location:</strong> {location.lat?.toFixed(4)}, {location.lng?.toFixed(4)}</p>
                <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
                {image && <img src={image} alt="Submitted" className="mt-4 rounded-lg shadow-md max-h-48 object-contain" />}
              </div>
              {qrCodeUrl && (
                <div className="mt-6 p-6 rounded-xl shadow-lg text-center" style={{ backgroundColor: 'white' }}>
                    <h3 className="text-2xl font-bold mb-4 flex items-center justify-center" style={{ color: primaryGreen }}>
                        <FaQrcode className="mr-2" /> Print this QR Code
                    </h3>
                    <img src={qrCodeUrl} alt="QR Code for Herb" className="mx-auto w-48 h-48 mb-4" />
                    <p className="text-gray-600 text-sm">Attach this code to your herb batch for traceability.</p>
                </div>
              )}
              <button
                onClick={resetForm}
                className="mt-6 w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200"
                style={{ backgroundColor: primaryGreen }}
              >
                Start New Entry
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default HerbForm;