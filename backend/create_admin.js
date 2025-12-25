import axios from "axios";

async function createAdmin() {
    try {
        await axios.post("http://localhost:5000/api/auth/register", {
            email: "admin@example.com",
            password: "password123"
        });
        console.log("Admin created successfully");
    } catch (error) {
        if (error.response && error.response.status === 500 && error.response.data.error.includes("duplicate")) {
            console.log("Admin already exists");
        } else {
            console.error("Error creating admin:", error.message);
        }
    }
}

createAdmin();
