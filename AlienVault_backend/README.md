# How to Run

## Add credentials as mentioned in `.env.examples`

**Create python venv and activate**
`python -m venv .venv`
`./.venv/Scripts/activate`

**Install required packages**
`pip install -r requirements.txt`

**Run uvicorn server (only for testing)**
`uvicorn main:app --reload`

**Go to Postman:**
* set method:**POST**
* URL: `http://127.0.0.1:8000/query?session_id=123445`
* go to body -> select raw(JSON) -> {"user_query":"What is machine learing?"}
* get the response