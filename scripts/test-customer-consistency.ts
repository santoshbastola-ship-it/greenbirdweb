import { UserService } from "./src/services/user.service";

async function testCustomer() {
    const name = "TestBugCustomer_" + Date.now();
    console.log(`Creating test customer: ${name}`);
    try {
        const id = await UserService.createCustomer({
            name,
            phoneNumber: "9800000000",
            address: "Test Address",
            partnerType: "customer"
        });
        console.log(`Customer created with ID: ${id}`);

        console.log("Fetching all partners...");
        const partners = await UserService.getAllPartners();
        const found = partners.find(p => p.id === id);

        if (found) {
            console.log("SUCCESS: Created customer found in getAllPartners result!");
            console.log("Data:", JSON.stringify(found, null, 2));
        } else {
            console.log("FAILURE: Created customer NOT found in getAllPartners result!");
            const allNames = partners.map(p => p.name);
            console.log("All names found:", allNames.join(", "));
        }
    } catch (err) {
        console.error("Test failed:", err);
    }
}

testCustomer().then(() => process.exit(0)).catch(() => process.exit(1));
