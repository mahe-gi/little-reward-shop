import { getPointsBalance, getPointsHistory, givePointsAction, deductPointsAction } from "@/actions/points";
import { getRewards } from "@/actions/rewards";
import {
  createOrderAction,
  approveOrderAction,
  rejectOrderAction,
  toggleFulfillmentItemAction,
  completeOrderAction,
  getOrders,
} from "@/actions/orders";
import { resetLocalDb } from "@/db";

import { __setMockSessionForTesting } from "@/lib/auth";

async function runEndToEndVerification() {
  console.log("=== STARTING END-TO-END VERIFICATION JOURNEY ===");

  // 0. Reset DB to baseline state
  console.log("\n[Step 0] Resetting test database state...");
  resetLocalDb();
  __setMockSessionForTesting({
    userId: "user_girlfriend",
    name: "Her",
    role: "girlfriend",
  });

  // 1. Girlfriend checks initial balance
  console.log("\n[Step 1] Girlfriend checks initial points balance...");
  const initialBalance = await getPointsBalance("user_girlfriend");
  console.log(`Initial Balance: ${initialBalance} points`);
  if (initialBalance !== 10) {
    throw new Error(`Expected initial balance to be 10, got ${initialBalance}`);
  }
  console.log("✓ Initial balance is strictly 10 points.");

  // Check initial transactions
  const history = await getPointsHistory("user_girlfriend");
  console.log(`Transactions Count: ${history.length}`);
  console.log(`Initial Transaction Reason: "${history[0]?.reason}", Amount: +${history[0]?.amount}`);
  if (history[0]?.amount !== 10 || history[0]?.reason !== "Starting points ❤️") {
    throw new Error("Initial transaction mismatch!");
  }
  console.log("✓ +10 transaction 'Starting points ❤️' verified.");

  // 2. Browse Rewards catalog
  console.log("\n[Step 2] Girlfriend browses catalog rewards...");
  const catalog = await getRewards({ activeOnly: true });
  console.log(`Active Rewards count: ${catalog.length}`);
  const movieReward = catalog.find((r) => r.title === "Favorite Movie");
  if (!movieReward || movieReward.points !== 5) {
    throw new Error("Favorite Movie reward not found or cost is not 5 points!");
  }
  console.log(`✓ Found "${movieReward.title}" (${movieReward.points} pts, ${movieReward.emoji}).`);

  // 3. Girlfriend creates an order for Favorite Movie (5 pts)
  console.log("\n[Step 3] Girlfriend submits redemption order for Favorite Movie (5 pts)...");
  const cartItems = [
    {
      rewardId: movieReward.id,
      title: movieReward.title,
      description: movieReward.description,
      points: movieReward.points,
      emoji: movieReward.emoji,
      quantity: 1,
    },
  ];

  const orderRes = await createOrderAction(cartItems, "Can we watch Interstellar tonight? 🥺");
  if (!orderRes.success) {
    throw new Error(`Order creation failed: ${orderRes.error}`);
  }
  console.log(`✓ Order created: ID=${orderRes.orderId}, Number=${orderRes.orderNumber}`);

  // CRITICAL CHECK: Points must REMAIN 10 while order is pending!
  console.log("\n[Step 4] CRITICAL CHECK: Verifying points balance during pending state...");
  const balanceWhilePending = await getPointsBalance("user_girlfriend");
  console.log(`Balance while pending: ${balanceWhilePending} points`);
  if (balanceWhilePending !== 10) {
    throw new Error(
      `CRITICAL VIOLATION: Points were deducted during cart/request! Balance is ${balanceWhilePending}, expected 10.`
    );
  }
  console.log("✓ GOLDEN RULE VERIFIED: 0 points deducted while order is pending. Balance is still 10!");

  // Verify order in pending list
  let orders = await getOrders();
  const pendingOrder = orders.find((o) => o.id === orderRes.orderId);
  if (!pendingOrder || pendingOrder.status !== "pending") {
    throw new Error("Order is not in pending status!");
  }
  console.log(`✓ Order ${pendingOrder.orderNumber} status is '${pendingOrder.status}'.`);

  // 4. Mahesh reviews and approves order
  console.log("\n[Step 5] Mahesh reviews and approves Order #0007...");
  // Simulate admin session
  __setMockSessionForTesting({
    userId: "user_mahesh",
    name: "Mahesh",
    role: "admin",
  });
  const approveRes = await approveOrderAction(pendingOrder.id);
  if (!approveRes.success) {
    throw new Error(`Approval failed: ${approveRes.error}`);
  }
  console.log("✓ Order approved successfully.");

  // CRITICAL CHECK: Balance should NOW be 10 - 5 = 5 points
  console.log("\n[Step 6] CRITICAL CHECK: Verifying point deduction after approval...");
  const balanceAfterApproval = await getPointsBalance("user_girlfriend");
  console.log(`Balance after approval: ${balanceAfterApproval} points`);
  if (balanceAfterApproval !== 5) {
    throw new Error(
      `Expected balance after approval to be 5, got ${balanceAfterApproval}`
    );
  }
  console.log("✓ ATOMIC DEDUCTION VERIFIED: 5 points deducted. New balance is exactly 5 points.");

  // Test double-approval guard
  console.log("\n[Step 7] Testing double-approval safeguard against race conditions...");
  const duplicateApprove = await approveOrderAction(pendingOrder.id);
  if (duplicateApprove.success) {
    throw new Error("CRITICAL ERROR: Double approval succeeded! Should have been rejected.");
  }
  console.log(`✓ Double approval safely prevented: "${duplicateApprove.error}"`);
  const balanceAfterDup = await getPointsBalance("user_girlfriend");
  if (balanceAfterDup !== 5) {
    throw new Error("Points deducted twice on duplicate approval!");
  }
  console.log("✓ Balance remained intact at 5 points.");

  // 5. Fulfillment Checklist
  console.log("\n[Step 8] Mahesh works on Fulfillment Checklist...");
  orders = await getOrders();
  const fulfillingOrder = orders.find((o) => o.id === orderRes.orderId);
  if (!fulfillingOrder) throw new Error("Order not found!");
  console.log(`Fulfillment items count: ${fulfillingOrder.fulfillmentItems.length}`);
  fulfillingOrder.fulfillmentItems.forEach((f, idx) => {
    console.log(`  [${f.completed ? "✓" : " "}] Item ${idx + 1}: ${f.label}`);
  });

  // Attempt to complete order before checking off items
  console.log("\n[Step 9] Attempting to mark order completed before checklist is done...");
  const prematureComplete = await completeOrderAction(fulfillingOrder.id);
  if (prematureComplete.success) {
    throw new Error("Order completed prematurely before checklist completion!");
  }
  console.log(`✓ Premature completion safely blocked: "${prematureComplete.error}"`);

  // Check off all items
  console.log("\n[Step 10] Checking off fulfillment checklist items...");
  for (const item of fulfillingOrder.fulfillmentItems) {
    await toggleFulfillmentItemAction(item.id, true);
    console.log(`  ✓ Checked off: ${item.label}`);
  }

  // Complete the order
  console.log("\n[Step 11] Marking order completed ❤️...");
  const completeRes = await completeOrderAction(fulfillingOrder.id);
  if (!completeRes.success) {
    throw new Error(`Failed to complete order: ${completeRes.error}`);
  }
  console.log("✓ Order completed successfully!");

  // 6. Girlfriend checks completed state
  console.log("\n[Step 12] Girlfriend views final delivered state...");
  orders = await getOrders();
  const deliveredOrder = orders.find((o) => o.id === orderRes.orderId);
  if (!deliveredOrder || deliveredOrder.status !== "completed") {
    throw new Error("Order status is not 'completed'!");
  }
  console.log(`✓ Order ${deliveredOrder.orderNumber} status: ${deliveredOrder.status}`);
  console.log(`✓ Completed at: ${deliveredOrder.completedAt}`);

  const finalBalance = await getPointsBalance("user_girlfriend");
  console.log(`Final Balance: ${finalBalance} points`);
  if (finalBalance !== 5) {
    throw new Error(`Expected final balance to be 5, got ${finalBalance}`);
  }
  console.log("✓ Final balance is verified at 5 points.");

  // 7. Test Rejection flow (Zero point deduction)
  console.log("\n[Step 13] Testing Rejection Flow...");
  __setMockSessionForTesting({
    userId: "user_girlfriend",
    name: "Her",
    role: "girlfriend",
  });
  const testCart2 = [
    {
      rewardId: "rew_1_hug",
      title: "One Hug",
      description: "A proper hug",
      points: 1,
      emoji: "❤️",
      quantity: 1,
    },
  ];
  const order2 = await createOrderAction(testCart2, "Hug request");
  console.log(`Created order for rejection test: ${order2.orderNumber}`);

  __setMockSessionForTesting({
    userId: "user_mahesh",
    name: "Mahesh",
    role: "admin",
  });
  const rejectRes = await rejectOrderAction(order2.orderId!, "Let's do this tonight instead ❤️");
  if (!rejectRes.success) throw new Error("Rejection failed!");
  console.log("✓ Order rejected successfully.");

  const balanceAfterReject = await getPointsBalance("user_girlfriend");
  if (balanceAfterReject !== 5) {
    throw new Error("Points deducted on rejected order!");
  }
  console.log(`✓ Verified 0 points deducted on rejection! Balance remains: ${balanceAfterReject} points.`);

  orders = await getOrders();
  const rejectedOrder = orders.find((o) => o.id === order2.orderId);
  if (rejectedOrder?.status !== "rejected" || !rejectedOrder.rejectionReason) {
    throw new Error("Rejected order state incomplete!");
  }
  console.log(`✓ Rejection reason saved and visible: "${rejectedOrder.rejectionReason}"`);

  console.log("\n=======================================================");
  console.log("🎉 ALL END-TO-END SCENARIOS & CRITICAL RULES PASSED! 🎉");
  console.log("=======================================================\n");
}

runEndToEndVerification().catch((err) => {
  console.error("\n❌ E2E VERIFICATION FAILED:", err);
  process.exit(1);
});
