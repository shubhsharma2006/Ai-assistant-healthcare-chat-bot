from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# ================== HEALTH CHECK ==================
@app.route("/", methods=["GET"])
def health():
    return jsonify({
        "success": True,
        "message": "ML Service Running 🚀"
    })

# ================== PREDICT ==================
@app.route("/predict", methods=["POST"])
def predict():
    try:
        if not request.is_json:
            return jsonify({
                "success": False,
                "message": "Content-Type must be application/json"
            }), 415

        logging.info(f"[{datetime.now()}] Incoming request: {request.get_json(silent=True)}")

        data = request.get_json()
        symptoms = data.get("symptoms", "").strip().lower()

        if not symptoms:
            return jsonify({
                "success": False,
                "message": "Symptoms are required"
            }), 400

        # 🔥 Simulated ML logic (replace with trained model later)
        if "chest pain" in symptoms or "heart" in symptoms:
            prediction = "High risk detected. Seek immediate medical attention."
        elif "fever" in symptoms or "infection" in symptoms:
            prediction = "Possible infection. Monitor temperature and consult a doctor."
        else:
            prediction = f"Based on symptoms: {symptoms}, consult a doctor if condition persists."

        severity = "low"
        if "high risk" in prediction.lower():
            severity = "high"
        elif "infection" in prediction.lower():
            severity = "medium"

        return jsonify({
            "success": True,
            "prediction": prediction,
            "severity": severity
        })

    except Exception as e:
        logging.error(f"Error: {str(e)}")
        return jsonify({
            "success": False,
            "message": "Internal ML Server Error"
        }), 500

# ================== RUN ==================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)