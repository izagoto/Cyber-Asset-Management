from app.core.database import SessionLocal, engine, Base
from app.models.user import User
from app.core.security import hash_password


def seed_database():
    print("Recreating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("Seeding admin user...")

        admin = User(
            email="cybersecurity@gmail.com",
            fullname="James Bond",
            password_hash=hash_password("Jbond123!"),
            role="ADMIN",
            division="Cyber Security Researcher",
            phone="+62 811-2222-3333"
        )

        db.add(admin)
        db.commit()

        # print("Database seeding completed successfully.")
        # print("Admin User:")
        # print("Email    : cybersecurity@gmail.com")
        # print("Password : Jbond123!")

    except Exception as e:
        db.rollback()
        print(f"Error while seeding database: {e}")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()