import { AuthService } from "../services/auth.service";
import { getAllCategories } from "../services/category.service";
import { getAllServices } from "../services/service.service";

async function runTestSuite() {
  console.log("================================================");
  console.log("🚀 Running ProServe Backend Test Suite");
  console.log("================================================\n");

  let passed = 0;
  let failed = 0;

  // Test 1: Category Listing
  try {
    console.log("▶ Test 1: Fetching All Categories...");
    const categories = await getAllCategories();
    console.log(`  ✔ Success: Retreived ${categories.length} categories.`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ Failed: ${err.message}`);
    failed++;
  }

  // Test 2: Service Listing
  try {
    console.log("\n▶ Test 2: Fetching All Services...");
    const services = await getAllServices();
    console.log(`  ✔ Success: Retreived ${services.length} services.`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ Failed: ${err.message}`);
    failed++;
  }

  // Test 3: User Registration with Test Data
  try {
    console.log("\n▶ Test 3: User Registration Test...");
    const testEmail = `test_user_${Date.now()}@example.com`;
    const result = await AuthService.register({
      fullName: "Automated Tester",
      email: testEmail,
      phone: "050 123 4567",
      password: "Password123!",
      role: "CUSTOMER",
    });

    console.log(`  ✔ Success: User registered!`);
    console.log(`    - ID: ${result.user.id}`);
    console.log(`    - Email: ${result.user.email}`);
    console.log(`    - Name: ${result.user.name}`);
    console.log(`    - Role: ${result.user.role}`);
    console.log(`    - Phone: ${result.profile.phone}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ Failed: ${err.message}`);
    failed++;
  }

  console.log("\n================================================");
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
