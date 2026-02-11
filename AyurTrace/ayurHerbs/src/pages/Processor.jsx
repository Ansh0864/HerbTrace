import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMapMarkerAlt, FaQrcode, FaSearch, FaPlusCircle, FaHistory, FaCamera, FaSpinner, FaCheckCircle } from "react-icons/fa";
import { Html5QrcodeScanner } from "html5-qrcode";
import { BarChart2, Zap, Shield, Award, CheckCircle2, Clock, MapPin, Package, AlertCircle, ChevronRight, Layers, Workflow } from "lucide-react";

export default function Processor({ colors = {} }) {
  const primaryGreen = colors.primaryGreen || "#4a7c59";
  const darkText = colors.darkText || "#222";
  const lightGrey = colors.lightGrey || "#f0f4f7";
  const goldTan = colors.goldTan || "#a87f4c";
  const accent = colors.accent || "#d29f4f";
  const success = colors.success || "#10B981";

  const [searchTerm, setSearchTerm] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [qrCodeScanner, setQrCodeScanner] = useState(null);
  const [verifiedHerbData, setVerifiedHerbData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingHerbId, setProcessingHerbId] = useState("");
  const [processingAction, setProcessingAction] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [qualityScore, setQualityScore] = useState(null);
  const [loadingQuality, setLoadingQuality] = useState(false);
  const [activeTab, setActiveTab] = useState('verify');

  const tabs = [
    { id: 'verify', label: 'Verify Batch', icon: Shield },
    { id: 'process', label: 'Add Processing', icon: Package },
    { id: 'quality', label: 'Quality Check', icon: Award }
  ];

  useEffect(() => {
    if (isScanning && !qrCodeScanner) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-code-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      html5QrcodeScanner.render(onScanSuccess, onScanError);
      setQrCodeScanner(html5QrcodeScanner);
    }
    return () => {
      if (qrCodeScanner) {
        qrCodeScanner.clear().catch(error => {
          console.error("Failed to clear scanner", error);
        });
        setQrCodeScanner(null);
      }
    };
  }, [isScanning]);

  const onScanSuccess = (decodedText) => {
    console.log(`Scan result: ${decodedText}`);
    const urlParts = decodedText.split('/');
    const herbId = urlParts[urlParts.length - 1];
    setSearchTerm(herbId);
    setProcessingHerbId(herbId);
    setIsScanning(false);
    handleSearch(herbId);
  };

  const onScanError = (error) => {
    console.warn(`QR code scan error: ${error}`);
  };

  const handleQrScan = () => {
    setIsScanning(true);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // pages/Processor.jsx - Updated handleSearch
const handleSearch = async (herbId = searchTerm) => {
  if (!herbId) {
    setError("Please enter a Herb ID to search.");
    setVerifiedHerbData(null);
    return;
  }
  setLoading(true);
  setError(null);

  try {
    // Connects to Endpoint 5: Consumer Traceability in main.py
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/trace_herb/${herbId}`);
    const data = await response.json();

    if (data.status === "success") {
      setVerifiedHerbData(data.data); // Loads origin and processingHistory
      setProcessingHerbId(herbId);
    } else {
      setError(data.message || "Herb ID not found.");
      setVerifiedHerbData(null);
    }
  } catch (err) {
    setError(`Connection error: ${err.message}`);
    setVerifiedHerbData(null);
  } finally {
    setLoading(false);
  }
};

// ... existing code (handleSearch function) ...

// REPLACE THE OLD handleProcessSubmit WITH THIS ONE:
const handleProcessSubmit = async (e) => {
  e.preventDefault();
  setMessage("");

  if (!processingHerbId || !processingAction) {
    setMessage("Herb ID and Action are required.");
    return;
  }

  const formData = new FormData();
  formData.append("action", processingAction); 

  try {
    const response = await fetch(`http://127.0.0.1:8000/process_herb/${processingHerbId}`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (data.status === "success") {
      // This fix ensures 'processingAction' is used instead of the undefined 'action'
      setMessage(`Processing step '${processingAction}' added successfully!`); 
      setProcessingAction("");
      handleSearch(processingHerbId); // Refreshes the timeline below automatically
    } else {
      setMessage(data.message);
    }
  } catch (err) {
    setMessage(`An error occurred: ${err.message}`);
  }
};



  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setQualityScore(null);
    }
  };



const handlePredictQuality = async () => {
  if (!imageFile) return;
  setLoadingQuality(true);
  
  const formData = new FormData();
  formData.append("image_file", imageFile);
  formData.append("latitude", 0); // Dummy for analysis only
  formData.append("longitude", 0);

  try {
    // This connects to Endpoint 1 in your main.py: @app.post("/submit_herb/")
    const response = await fetch(`http://127.0.0.1:8000/submit_herb/`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    
    // Updates the UI with real AI species identification and confidence from the backend
    setQualityScore(`${data.ai_result.verified_species} - Confidence: ${data.ai_result.confidence}`);
  } catch (err) {
    setQualityScore("Analysis failed.");
  } finally {
    setLoadingQuality(false);
  }
};

  return (
    <motion.div 
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            background: `linear-gradient(135deg, ${primaryGreen}, ${goldTan})`
          }}
        />
        <motion.div
          className="relative max-w-7xl mx-auto px-6 py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center space-x-6 mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <div 
                className="p-6 rounded-3xl shadow-2xl"
                style={{ backgroundColor: primaryGreen }}
              >
                <Workflow className="text-white text-5xl" />
              </div>
              <div className="text-left">
                <h1 className="text-6xl font-black mb-2" style={{ color: darkText }}>
                  <span style={{ color: goldTan }}>Processor</span> Dashboard
                </h1>
                <p className="text-xl opacity-70" style={{ color: darkText }}>
                  Verify, process, and ensure quality at every step of the supply chain
                </p>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
              {[
                { label: "Batches Processed", value: "1,247", icon: Package, color: primaryGreen },
                { label: "Quality Checks", value: "892", icon: Award, color: success },
                { label: "Verified Steps", value: "3,241", icon: CheckCircle2, color: accent },
                { label: "Active Batches", value: "156", icon: Clock, color: goldTan }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  className="p-6 rounded-2xl shadow-xl border backdrop-blur-sm"
                  style={{ 
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.borderColor
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-black" style={{ color: stat.color }}>
                        {stat.value}
                      </p>
                      <p className="text-sm font-medium opacity-70" style={{ color: darkText }}>
                        {stat.label}
                      </p>
                    </div>
                    <div 
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: `${stat.color}15` }}
                    >
                      <stat.icon size={24} style={{ color: stat.color }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        {/* Enhanced Tab Navigation */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-center">
            <div 
              className="flex p-2 rounded-2xl shadow-lg"
              style={{ backgroundColor: colors.cardBackground }}
            >
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === tab.id 
                      ? 'text-white shadow-lg' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  style={{ 
                    backgroundColor: activeTab === tab.id ? primaryGreen : 'transparent'
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <tab.icon size={20} />
                  <span>{tab.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Verify Batch Tab */}
          {activeTab === 'verify' && (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Enhanced Search Section */}
              <motion.div
                className="group relative overflow-hidden rounded-3xl shadow-2xl border transition-all duration-300 hover:shadow-3xl"
                style={{ 
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.borderColor
                }}
                whileHover={{ y: -4 }}
              >
                <div 
                  className="absolute top-0 left-0 w-full h-2 opacity-60"
                  style={{ backgroundColor: primaryGreen }}
                />
                <div className="p-8">
                  <div className="flex items-center mb-8">
                    <div 
                      className="p-4 rounded-xl mr-4 shadow-md"
                      style={{ backgroundColor: primaryGreen }}
                    >
                      <Shield className="text-white text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold" style={{ color: primaryGreen }}>
                        Batch Verification
                      </h2>
                      <p className="text-sm opacity-70 mt-1" style={{ color: darkText }}>
                        Scan QR codes or search by Herb ID to verify batch authenticity
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="flex gap-4">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Enter Herb ID (try: 0)..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full p-6 rounded-2xl border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-opacity-30 font-medium text-lg"
                            style={{ 
                              backgroundColor: `${lightGrey}80`,
                              borderColor: colors.borderColor,
                              color: darkText
                            }}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                          />
                          <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none">
                            <kbd className="hidden sm:inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 text-sm font-semibold text-gray-600">
                              Enter
                            </kbd>
                          </div>
                        </div>
                        <motion.button
                          onClick={() => handleSearch()}
                          disabled={loading}
                          className="px-8 py-6 rounded-2xl font-bold text-white transition-all duration-300 shadow-lg relative overflow-hidden"
                          style={{ backgroundColor: primaryGreen }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {loading ? (
                            <FaSpinner className="animate-spin text-2xl" />
                          ) : (
                            <FaSearch className="text-2xl" />
                          )}
                        </motion.button>
                        <motion.button
                          onClick={handleQrScan}
                          className="px-8 py-6 rounded-2xl font-bold text-white transition-all duration-300 shadow-lg"
                          style={{ backgroundColor: goldTan }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <FaQrcode className="text-2xl" />
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {isScanning && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-8 rounded-2xl border-2 border-dashed text-center"
                            style={{ borderColor: accent, backgroundColor: `${accent}08` }}
                          >
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <FaCamera className="text-6xl mx-auto mb-4" style={{ color: accent }} />
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-4" style={{ color: darkText }}>
                              QR Scanner Active
                            </h3>
                            <div id="qr-code-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}></div>
                            <button
                              onClick={() => setIsScanning(false)}
                              className="mt-4 px-6 py-2 rounded-lg font-semibold transition-colors"
                              style={{ color: colors.error, backgroundColor: `${colors.error}15` }}
                            >
                              Cancel Scan
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Enhanced Herb Details Panel */}
                    <motion.div
                      className="p-6 rounded-2xl shadow-lg border min-h-[400px]"
                      style={{ 
                        backgroundColor: `${primaryGreen}08`,
                        borderColor: colors.borderColor
                      }}
                    >
                      <h3 className="text-2xl font-bold mb-6 flex items-center" style={{ color: primaryGreen }}>
                        <MapPin className="mr-3" />
                        Batch Details
                      </h3>
                      
                      {loading && (
                        <div className="flex flex-col items-center justify-center h-64">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="mb-4"
                          >
                            <Layers className="text-6xl" style={{ color: primaryGreen }} />
                          </motion.div>
                          <p className="text-lg font-medium" style={{ color: darkText }}>
                            Verifying batch...
                          </p>
                        </div>
                      )}
                      
                      {error && (
                        <div className="flex flex-col items-center justify-center h-64">
                          <AlertCircle className="text-6xl mb-4" style={{ color: colors.error }} />
                          <p className="text-center font-medium" style={{ color: colors.error }}>
                            {error}
                          </p>
                        </div>
                      )}
                      
                      {verifiedHerbData && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          {/* Origin Info */}
                          <div 
                            className="p-4 rounded-xl border-l-4"
                            style={{ 
                              backgroundColor: `${success}15`,
                              borderColor: success
                            }}
                          >
                            <h4 className="font-bold text-lg mb-3" style={{ color: success }}>
                              ✓ Verified Origin
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium opacity-70">Name:</span>
                                <span className="font-bold">{verifiedHerbData.origin.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium opacity-70">Quality:</span>
                                <span className="font-bold" style={{ color: success }}>
                                  {verifiedHerbData.origin.quality}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium opacity-70">AI Confidence:</span>
                                <span className="font-bold" style={{ color: accent }}>
                                  {verifiedHerbData.origin.confidenceScore}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium opacity-70">Farmer:</span>
                                <span className="font-bold">{verifiedHerbData.origin.farmer}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium opacity-70">Location:</span>
                                <span className="font-mono text-xs">
                                  {verifiedHerbData.origin.latitude.toFixed(4)}, {verifiedHerbData.origin.longitude.toFixed(4)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Certifications */}
                          <div>
                            <h4 className="font-bold mb-3" style={{ color: darkText }}>
                              Certifications:
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {verifiedHerbData.processingHistory?.map((step, index) => (
                                <div 
                                  key={index}
                                  className="p-3 rounded-lg border-l-4 text-sm"
                                  style={{ 
                                    backgroundColor: `${primaryGreen}08`,
                                    borderColor: step.verified ? success : goldTan
                                  }}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="font-bold" style={{ color: primaryGreen }}>
                                      {step.action}
                                    </span>
                                    {step.verified && (
                                      <CheckCircle2 size={16} style={{ color: success }} />
                                    )}
                                  </div>
                                  <p className="opacity-70 mb-1">{step.location}</p>
                                  <p className="text-xs opacity-60">
                                    {new Date(step.timestamp * 1000).toLocaleString()}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Processing History */}
                          <div>
                            <h4 className="font-bold mb-3" style={{ color: darkText }}>
                              Processing History:
                            </h4>
                            <div className="space-y-3">
                              {verifiedHerbData.processingHistory?.length > 0 ? (
                                verifiedHerbData.processingHistory.map((step, index) => (
                                  
                                  // PASTE THE UPDATED LOGIC HERE 
                                  <div 
                                    key={index}
                                    className="p-3 rounded-lg border-l-4 text-sm"
                                    style={{ 
                                      backgroundColor: `${primaryGreen}08`,
                                      borderColor: step.processor ? success : goldTan
                                    }}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <span className="font-bold" style={{ color: primaryGreen }}>
                                        {step.action}
                                      </span>
                                      {step.processor && (
                                        <CheckCircle2 size={16} style={{ color: success }} />
                                      )}
                                    </div>
                                    <p className="opacity-70 mb-1">Batch: {step.batchNumber}</p>
                                    <p className="text-xs opacity-60">
                                      {new Date(step.timestamp * 1000).toLocaleString()}
                                    </p>
                                  </div>
                                  // END OF UPDATED LOGIC

                                ))
                              ) : (
                                <p className="text-center opacity-60 py-4">
                                  No processing steps recorded yet.
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {!loading && !error && !verifiedHerbData && (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <Shield className="text-8xl mb-4 opacity-20" style={{ color: darkText }} />
                          <h4 className="text-xl font-bold mb-2" style={{ color: darkText }}>
                            Ready to Verify
                          </h4>
                          <p className="opacity-60 max-w-sm" style={{ color: darkText }}>
                            Enter a Herb ID or scan a QR code to view batch details and processing history
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Add Processing Tab */}
          {activeTab === 'process' && (
            <motion.div
              key="process"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <motion.div
                className="rounded-3xl shadow-2xl border overflow-hidden"
                style={{ 
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.borderColor
                }}
              >
                <div 
                  className="absolute top-0 left-0 w-full h-2 opacity-60"
                  style={{ backgroundColor: accent }}
                />
                <div className="p-8">
                  <div className="flex items-center mb-8">
                    <div 
                      className="p-4 rounded-xl mr-4 shadow-md"
                      style={{ backgroundColor: accent }}
                    >
                      <Package className="text-white text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold" style={{ color: accent }}>
                        Add Processing Step
                      </h2>
                      <p className="text-sm opacity-70 mt-1" style={{ color: darkText }}>
                        Record new processing steps to maintain complete traceability
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleProcessSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-lg font-semibold mb-3" style={{ color: darkText }}>
                          Herb ID
                        </label>
                        <input
                          type="text"
                          value={processingHerbId}
                          onChange={(e) => setProcessingHerbId(e.target.value)}
                          placeholder="e.g., 0"
                          className="w-full p-4 rounded-xl border-2 transition-all font-medium text-lg"
                          style={{ 
                            backgroundColor: lightGrey,
                            borderColor: colors.borderColor,
                            color: darkText
                          }}
                          disabled={!verifiedHerbData}
                        />
                        {!verifiedHerbData && (
                          <p className="text-sm opacity-60 mt-2" style={{ color: darkText }}>
                            First verify a batch to enable processing
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-lg font-semibold mb-3" style={{ color: darkText }}>
                          Processing Action
                        </label>
                        <input
                          type="text"
                          value={processingAction}
                          onChange={(e) => setProcessingAction(e.target.value)}
                          placeholder="e.g., Packaged, Quality Tested, Shipped"
                          className="w-full p-4 rounded-xl border-2 transition-all font-medium text-lg"
                          style={{ 
                            backgroundColor: lightGrey,
                            borderColor: colors.borderColor,
                            color: darkText
                          }}
                          disabled={!verifiedHerbData}
                        />
                      </div>
                    </div>
                    
                    <motion.button
                      type="submit"
                      className="w-full py-6 px-8 rounded-2xl font-bold text-white text-xl shadow-2xl transition-all duration-300 relative overflow-hidden group"
                      style={{ backgroundColor: verifiedHerbData ? accent : colors.lightGrey }}
                      disabled={!verifiedHerbData}
                      whileHover={verifiedHerbData ? { scale: 1.02, y: -2 } : {}}
                      whileTap={verifiedHerbData ? { scale: 0.98 } : {}}
                    >
                      <span className="relative z-10 flex items-center justify-center space-x-3">
                        <FaPlusCircle size={24} />
                        <span>Submit Processing Step</span>
                        <ChevronRight size={20} />
                      </span>
                      {verifiedHerbData && (
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                      )}
                    </motion.button>

                    {message && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-2xl text-center font-semibold text-lg border-l-4 ${
                          message.includes('successfully') 
                            ? `border-l-4` 
                            : ''
                        }`}
                        style={{ 
                          backgroundColor: message.includes('successfully') ? `${success}15` : `${colors.error}15`,
                          borderColor: message.includes('successfully') ? success : colors.error,
                          color: message.includes('successfully') ? success : colors.error
                        }}
                      >
                        <div className="flex items-center justify-center space-x-3">
                          {message.includes('successfully') ? (
                            <CheckCircle2 size={28} />
                          ) : (
                            <AlertCircle size={28} />
                          )}
                          <span>{message}</span>
                        </div>
                      </motion.div>
                    )}
                  </form>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Quality Check Tab */}
          {activeTab === 'quality' && (
            <motion.div
              key="quality"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <motion.div
                className="rounded-3xl shadow-2xl border overflow-hidden"
                style={{ 
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.borderColor
                }}
              >
                <div 
                  className="absolute top-0 left-0 w-full h-2 opacity-60"
                  style={{ backgroundColor: goldTan }}
                />
                <div className="p-8">
                  <div className="flex items-center mb-8">
                    <div 
                      className="p-4 rounded-xl mr-4 shadow-md"
                      style={{ backgroundColor: goldTan }}
                    >
                      <Award className="text-white text-3xl" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold" style={{ color: goldTan }}>
                        AI Quality Assessment
                      </h2>
                      <p className="text-sm opacity-70 mt-1" style={{ color: darkText }}>
                        Upload herb images for instant AI-powered quality analysis
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <label className="group relative overflow-hidden flex items-center justify-center space-x-4 py-8 px-8 rounded-2xl font-bold text-white transition-all duration-300 cursor-pointer shadow-xl text-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1" 
                             style={{ backgroundColor: primaryGreen }}>
                        <FaCamera size={28} />
                        <span>Take Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          capture="environment" 
                          onChange={handleImageChange} 
                          className="hidden" 
                        />
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                      </label>
                      <label className="group relative overflow-hidden flex items-center justify-center space-x-4 py-8 px-8 rounded-2xl font-bold text-white transition-all duration-300 cursor-pointer shadow-xl text-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1" 
                             style={{ backgroundColor: goldTan }}>
                        <Zap size={28} />
                        <span>Upload Image</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageChange} 
                          className="hidden" 
                        />
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                      </label>
                    </div>

                    {imageFile && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 text-center rounded-2xl border-2 border-dashed"
                        style={{ 
                          backgroundColor: `${success}10`,
                          borderColor: success
                        }}
                      >
                        <CheckCircle2 className="text-4xl mx-auto mb-3" style={{ color: success }} />
                        <h3 className="text-xl font-bold mb-2" style={{ color: darkText }}>
                          Image Ready for Analysis
                        </h3>
                        <p className="font-semibold text-lg" style={{ color: darkText }}>
                          {imageFile.name}
                        </p>
                        <p className="text-sm opacity-70 mt-2" style={{ color: darkText }}>
                          Click analyze to process with AI
                        </p>
                      </motion.div>
                    )}

                    <motion.button
                      onClick={handlePredictQuality}
                      disabled={!imageFile || loadingQuality}
                      className={`w-full py-8 rounded-2xl font-bold text-white text-xl transition-all duration-300 shadow-2xl relative overflow-hidden ${
                        !imageFile ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-3xl transform hover:scale-105'
                      }`}
                      style={{ backgroundColor: goldTan }}
                      whileHover={imageFile ? { y: -2 } : {}}
                      whileTap={imageFile ? { scale: 0.98 } : {}}
                    >
                      <span className="relative z-10 flex items-center justify-center space-x-4">
                        {loadingQuality ? (
                          <>
                            <FaSpinner className="animate-spin" size={28} />
                            <span>AI Analyzing Quality...</span>
                          </>
                        ) : (
                          <>
                            <BarChart2 size={28} />
                            <span>Analyze Quality with AI</span>
                          </>
                        )}
                      </span>
                      {imageFile && !loadingQuality && (
                        <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity" />
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {qualityScore && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 30 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -30 }}
                          className="p-8 text-center rounded-3xl shadow-2xl border-l-4 relative overflow-hidden"
                          style={{ 
                            backgroundColor: `${success}15`,
                            borderColor: success
                          }}
                        >
                          <Award className="text-6xl mx-auto mb-6" style={{ color: success }} />
                          <h3 className="text-3xl font-bold mb-4" style={{ color: darkText }}>
                            Quality Assessment Complete
                          </h3>
                          <p className="text-4xl font-black mb-6" style={{ color: success }}>
                            {qualityScore}
                          </p>
                          <div className="grid grid-cols-3 gap-6 text-center">
                            <div>
                              <div className="text-3xl font-black" style={{ color: accent }}>98.5%</div>
                              <div className="text-sm font-semibold opacity-70">Accuracy</div>
                            </div>
                            <div>
                              <div className="text-3xl font-black" style={{ color: success }}>High</div>
                              <div className="text-sm font-semibold opacity-70">Confidence</div>
                            </div>
                            <div>
                              <div className="text-3xl font-black" style={{ color: goldTan }}>A+</div>
                              <div className="text-sm font-semibold opacity-70">Grade</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}