from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controller import Authentication, Contracts, Profile, ChatBot

from config.db import engine, base, sessionLocal
from sqlalchemy import text

base.metadata.create_all(bind=engine)
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(Authentication.router, prefix="/auth", tags=["auth"])
app.include_router(Contracts.router, prefix="/contract", tags=["contract"])
app.include_router(Profile.router, prefix="/profile", tags=["profile"])
app.include_router(ChatBot.router, prefix="/chatbot", tags=["chatbot"])


@app.on_event("startup")
def reset_sequences():
    """
    Auto-reset PostgreSQL sequences so they are always ≥ max(id)+1.
    Prevents UniqueViolation when sequences get out of sync with actual data.
    """
    tables = ["clause", "document", "users"]
    db = sessionLocal()
    try:
        for table in tables:
            try:
                # Find the sequence name for this table's id column
                result = db.execute(text(
                    f"SELECT pg_get_serial_sequence('{table}', 'id')"
                )).scalar()

                if result:
                    db.execute(text(
                        f"SELECT setval('{result}', COALESCE((SELECT MAX(id) FROM {table}), 0) + 1, false)"
                    ))
                    print(f"[startup] Reset sequence for {table}: {result}")
                else:
                    # No sequence found — create one and attach it
                    seq_name = f"{table}_id_seq"
                    db.execute(text(f"""
                        DO $$
                        BEGIN
                            IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = '{seq_name}') THEN
                                CREATE SEQUENCE {seq_name};
                            END IF;
                            PERFORM setval('{seq_name}',
                                COALESCE((SELECT MAX(id) FROM {table}), 0) + 1, false);
                            ALTER TABLE {table} ALTER COLUMN id
                                SET DEFAULT nextval('{seq_name}');
                        END $$;
                    """))
                    print(f"[startup] Created and attached sequence for {table}: {seq_name}")
            except Exception as e:
                print(f"[startup] Could not reset sequence for {table}: {e}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    app.run(debug=True)