# Notification Triggers & Templates

## Legend
- **Admins**: All users with `admin` or `manager` role.
- **Customer**: The specific user associated with the transaction/event.
- **Assignee**: The user assigned to a specific task.

---

## 1. Transactions & Orders (TransactionService)

### New Order (Sale/Purchase)
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `New {type} Order`
- **Body**: `New {type} from {partyName} for {itemCount} items.`

### Order Placed (Sale)
- **Target**: Customer
- **Channel**: In-App, WhatsApp, Push
- **Title**: `Order Placed Successfully`
- **Body**: `Thank you. Your order {billNo} ( {itemList} ) has been placed successfully.`

### Order Cancelled
- **Target**: Customer
- **Channel**: In-App, WhatsApp, Push
- **Title**: `Order Cancelled`
- **Body**: `Your order {billNo} ( {itemList} ) has been cancelled. Reason: {reason}`
> *Note: Also notifies Admins: "Order Cancelled", "Order #{billNo} has been cancelled..."*

### Order Delivered
- **Target**: Customer
- **Channel**: In-App, WhatsApp, Push
- **Title**: `Order Delivered!`
- **Body**: `Your order {billNo} ( {itemList} ) has been delivered! Thank you for shopping with Greenbird Homestead.`

### Order Confirmed
- **Target**: Customer
- **Channel**: In-App, WhatsApp, Push
- **Title**: `Order Confirmed`
- **Body**: `Your order {billNo} ( {itemList} ) has been confirmed and is being prepared.`

### Order Received (Open)
- **Target**: Customer
- **Channel**: In-App, WhatsApp, Push
- **Title**: `Order Received`
- **Body**: `Your order {billNo} ( {itemList} ) has been received and is being reviewed.`

### Order Status Change (Other)
- **Target**: Customer
- **Channel**: In-App, WhatsApp, Push
- **Title**: `Order Status Updated`
- **Body**: `Your order {billNo} ( {itemList} ) is now {status}. {reason}`

### Payment Received/Updated
- **Target**: Customer
- **Channel**: In-App, WhatsApp, Push
- **Title**: `Payment {Received/Updated}`
- **Body**: `Payment for order {billNo} has been updated. Total paid: Rs {amount}. Status: {status}.`

### Admin Payment Alert
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Payment Received: #{billNo}`
- **Body**: `Payment Received for Order #{billNo} from {partyName}...`

### Transaction Edited
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Transaction Updated`
- **Body**: `Transaction #{id} has been updated.`

### Transaction Deleted
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Order Deleted`
- **Body**: `Order #{billNo} for {partyName} has been deleted.`

---

## 2. Products & Inventory (ProductService)

### New Product
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `New Product Created`
- **Body**: `New product created: {name}`

### Product Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Product Updated`
- **Body**: `Product updated: {name} {changes} by {user} at {time}`

### Stock Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Stock Updated`
- **Body**: `Product updated: {name} (stock updated: {action} {qty}, New total: {total}) by {user} at {time}`

### Product Deleted
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Product Deleted`
- **Body**: `Product deleted: {name} by {user} at {time}`

---

## 3. Users & Partners (UserService)

### New Partner Created
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `New Partner Created`
- **Body**: `New {type} created: {name}`

### New User Invited
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `New User Invited`
- **Body**: `New user invited: {email} as {role}`

### User Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `User Updated`
- **Body**: `User updated: {name}`

### User Status Change
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `User Status Changed`
- **Body**: `User {id} status changed to {Active/Inactive}`

### User Deleted
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `User Deleted`
- **Body**: `User deleted: {id}`

---

## 4. Bookings (BookingService)

### New Booking
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `New Booking`
- **Body**: `New booking received from {name} for {date}`

### Booking Status Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Booking Status Updated`
- **Body**: `Booking {id} status updated to {status}`

### Booking Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Booking Updated`
- **Body**: `Booking {id} updated`

### Booking Deleted
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Booking Deleted`
- **Body**: `Booking {id} deleted`

---

## 5. Tasks (TaskService)

### New Task Assigned
- **Target**: Assignee
- **Channel**: In-App, WhatsApp
- **Title**: `New Task Assigned`
- **Body**: `You have been assigned a new task: {title}`

### New Task Created
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `New Task Created`
- **Body**: `New task created: {title}`

### Task Completed
- **Target**: Admins
- **Channel**: In-App
- **Title**: `Task Completed`
- **Body**: `Task "{title}" has been marked as Done.`

### Task Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Task Updated`
- **Body**: `Task updated: {title}`

### Task Deleted
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Task Deleted`
- **Body**: `Task "{title}" has been deleted.`

---

## 6. Content (Blog, Activities, Testimonials)

### New Blog Post
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `New Blog Post`
- **Body**: `New blog post created: {title}`

### Blog Post Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Blog Post Updated`
- **Body**: `Blog post updated: {id}`

### Blog Post Deleted
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Blog Post Deleted`
- **Body**: `Blog post deleted: {id}`

### New Farm Activity
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `New Farm Activity`
- **Body**: `New activity added: {title}`

### Activity Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Farm Activity Updated`
- **Body**: `Activity updated: {title}`

### Activity Status Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Activity Status Updated`
- **Body**: `Activity {title} status updated to {Published/Draft}`

### Activity Deleted
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Activity Deleted`
- **Body**: `Activity deleted: {id}`

### New Testimonial
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `New Testimonial`
- **Body**: `New testimonial added from {name}`

### Testimonial Status Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Testimonial Status Updated`
- **Body**: `Testimonial {id} status updated to {Published/Draft}`

### Testimonial Deleted
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Testimonial Deleted`
- **Body**: `Testimonial deleted: {id}`

---

## 7. Other (Settings, Energy)

### Settings Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Settings Updated`
- **Body**: `App global settings have been updated.`

### New Energy Bill
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `New Energy Bill`
- **Body**: `New {type} bill added for {month} {year}`

### Energy Bill Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Energy Bill Updated`
- **Body**: `Energy bill updated: {id}`

### Energy Bill Deleted
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Energy Bill Deleted`
- **Body**: `Energy bill deleted: {id}`

### Bill Payment Updated
- **Target**: Admins
- **Channel**: In-App, WhatsApp
- **Title**: `Bill Payment Updated`
- **Body**: `Payment status updated for bill {id}: {status}`

### Test Notification
- **Target**: Self
- **Channel**: In-App
- **Title**: `Test Notification`
- **Body**: `This is a test notification to verify the system.`
