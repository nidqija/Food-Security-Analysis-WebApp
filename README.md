# 🌾 Food Security Intelligence Platform

A predictive analytics platform designed to monitor and forecast food security risks across Malaysian states using machine learning (XGBoost) and AI-driven insights (Ollama).

---

## 🚀 Overview
This system analyzes historical agricultural and market data to provide an early warning system for food instability. By leveraging data-driven forecasting, the platform helps stakeholders:

* **Monitor** state-level agricultural conditions in real-time.
* **Predict** future food price fluctuations.
* **Estimate** potential yield drops due to environmental factors.
* **Generate** AI-powered insights and mitigation recommendations.
* **Calculate** comprehensive food security risk scores.

---

## 🏗 System Architecture

The platform follows a modern decoupled architecture, ensuring scalability and efficient data processing.

1.  **Frontend:** Next.js serves the interactive dashboard.
2.  **API Layer:** FastAPI handles requests and model orchestration.
3.  **Data Layer:** PostgreSQL stores historical climate and market data.
4.  **Inference Layer:** XGBoost processes numerical features; Ollama generates natural language insights.

---

## 🧠 Core Features

### 📊 1. State-Level Dashboard
Visualizes critical KPIs across Malaysian states using interactive charts:
* **Climate Monitoring:** Monthly rainfall and temperature trends.
* **Agri-Health:** Crop yield trends and Disease Index monitoring.
* **Market Pulse:** Real-time market price changes.

### 🔮 2. Predictive Analytics (XGBoost)
The system utilizes a Gradient Boosting model to forecast market volatility.

**Model Inputs:**
* `Rainfall` & `Temperature` (Climate Data)
* `Yield` (Production Data)
* `Disease_Index` (Biological Risk)

**Model Outputs:**
* 📈 **Price_Change:** Predicted percentage increase/decrease in market cost.
* 📉 **Yield_Drop:** Potential percentage loss in harvest.

### 📰 3. News Sentiment Scraper
An automated evaluation engine that scans the Malaysian media landscape to capture qualitative supply shocks.
* **Targeted Scraping:** Monitors local news for keywords like "shortage," "price ceiling," "supply chain," or "crop damage."
* **Impact Evaluation:** Uses NLP to transform headlines into a numerical **Supply Score**, capturing risks that numerical data might lag behind (e.g., sudden policy changes or floods).
* **Localized Alerts:** Maps news events to specific states to validate and refine predictive anomalies.

### 🚨 4. Risk Scoring System
The platform translates complex ML outputs and news sentiment into an intuitive risk scale:
* 🟢 **Low Risk:** Stable supply and pricing.
* 🟡 **Medium Risk:** Emerging anomalies; monitoring recommended.
* 🔴 **High Risk:** Significant price spikes or yield drops predicted; intervention required.

### 🤖 5. AI Insights (Ollama Integration)
After numerical and news data are processed, the system uses a local LLM (Ollama) to produce:
* **Root Cause Analysis:** Explaining why a specific state is at risk.
* **Agricultural Recommendations:** Suggested crops or irrigation adjustments.
* **Market Outlook:** A human-readable summary for policymakers.

---

## 🛠 Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | Next.js, Tailwind CSS, Lucide React |
| **Backend** | FastAPI (Python), SQLAlchemy, Pandas |
| **Database** | PostgreSQL |
| **Machine Learning** | XGBoost, Scikit-learn, Pickle |
| **Scraping/NLP** | BeautifulSoup4, Newspaper3k |
| **AI Layer** | Ollama (Local Llama 3 / Mistral) |

---

## 🏁 Getting Started

### Prerequisites
* Python 3.9+
* Node.js 18+
* PostgreSQL Instance
* [Ollama](https://ollama.com/) installed and running

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/your-username/food-security-intelligence.git](https://github.com/your-username/food-security-intelligence.git)
   cd food-security-intelligence