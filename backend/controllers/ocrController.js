const axios = require("axios");

exports.analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please upload an image",
      });
    }

    const base64Image = req.file.buffer.toString("base64");

    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        requests: [
          {
            image: {
              content: base64Image,
            },
            features: [
              {
                type: "DOCUMENT_TEXT_DETECTION",
              },
            ],
          },
        ],
      }
    );

    const annotation =
      response.data.responses?.[0]?.fullTextAnnotation;

    const text = annotation?.text || "";

    res.status(200).json({
      text,
      annotation,
    });
  } catch (error) {
    console.error(
      "OCR error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      message: "OCR processing failed",
    });
  }
};