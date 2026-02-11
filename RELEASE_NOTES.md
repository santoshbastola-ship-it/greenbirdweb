# Release Notes

## [0.2.8] - 2026-02-10
- Admin flow improvements, unified order/sales view, receipt display updates, and product visibility features


## [0.2.7] - 2026-02-10
- Fixed product update and stock modification issues


## [0.2.6] - 2026-02-09
- Fixed product discount visibility issues and updated badge position


## [0.2.5] - 2026-02-08
- Updated customer list sorting and dashboard details


## [0.2.4] - 2026-02-06
- Fixed search bar responsiveness on mobile and improved search results header layout


## [0.2.3] - 2026-02-05
### Product Experience
- Redesigned Product Detail page with floating "Add to Cart" button and improved quantity selection.
- Cleaned up product gallery by removing numerical counters in favor of dot indicators.
- Minimized footer on product pages for better focus.

### Checkout & Location
- Refined delivery location selection with reverse geocoding for pinned locations.
- Improved UX by making saved addresses and pinned locations mutually exclusive during selection.

### User Interface
- Moved mobile search bar to the top navigation for better accessibility.
- Improved notification system with auto-disappearing toast messages.
- Standardized notification date and time formatting.
- Enhanced product list display with category and unit information in a single row.

### Admin Enhancements
- Added collapsible sections to the admin menu for better organization.
- Implemented unit-based decimal restrictions for product quantities.

### Communication
- Updated WhatsApp message templates for order confirmations and support.

### Bug Fixes
- Fixed Firebase Admin initialization for environments with missing keys.
- Resolved build errors in cart and payment modules.

## [0.2.2] - 2026-02-03
- Reorganized admin menu, updated notification messages, and fixed category filters


## [0.2.1] - 2026-02-03
- Integrated various features: categories, notifications, UI improvements, and quantity decimal support


## [0.1.9] - 2026-01-24
### Fixed
- **Admin Dashboard**: Resolved an issue where refreshing the admin dashboard would incorrectly redirect specific admin roles to the home page.
- **Order Status Dropdown**: Fixed visibility issues where options were truncated or hidden.
- **Customer Transactions**: Fixed bug where customer transaction history was not displaying correctly.
- **Static Export**: Fixed build errors for dynamic routes (`/shop/[id]`, `/blog/[slug]`, `/admin/inventory/edit/[id]`) to support `output: export` configuration.

### Changed
- **Date Formatting**: Adopted Nepali calendar with English numerals for all transaction dates.
- **Admin Login**: Consolidated admin login flow for better security and user experience.
- **Payment Status**: Added payment status tracking to admin order management.

## [0.1.8] - 2026-01-24
### Added
- **Remaining Payment Display**:
  - Admin Order List: Shows "Remaining: Rs. X" for partially paid orders.
  - Admin Order Details: Added "Remaining Amount" row in the order items table.
  - Customer Order History: Shows "Remaining: Rs. X" for partially paid orders.

### Changed
- **Mobile UI**: Improved alignment of status dropdown and action buttons on mobile devices.
- **Dropdown Behavior**: Order status dropdown now opens upwards on mobile to prevent clipping and alignment issues.

### Fixed
- **Partial Payment Dates**: Fixed issue where partial payment dates were showing as "Invalid Date".
- **Interaction Issues**: Order card no longer opens details on clicking anywhere; now requires clicking "View Details".

## [0.1.7] - 2026-01-24
### Added
- **Global App Settings**: Introduced a new Settings page for administrators to manage delivery fees, free delivery thresholds, and application-wide discounts.
- **Admin Layout Engine**: Implemented `ConditionalNavbar` and `ConditionalFooter` to provide a clean, dedicated interface for admin and manager roles.
- **Admin Navigation**: Updated Admin Sidebar with quick access to Orders and Settings.
- **Manual Admin Setup Guide**: Added a detailed step-by-step guide for creating admin users via Firebase Console for improved security.
- **Contact Integration**: Replaced legacy "My Orders" link in footer with "Contact Us" for better customer support access.

### Changed
- **Navigation Security**: Navbar icons (Cart, Checkout) are now contextual and only visible to authenticated users.
- **Date Formatting**: Standardized Nepali date conversion to consistently use English numerals for better cross-browser compatibility.
- **Auth Flow**: Improved reliability of verification email resending on the admin login page with better error handling.

### Fixed
- **Admin Setup**: Removed the temporary web-based admin setup page (`/temp-setup-admin`) to close security gaps.
- **Logout Logic**: Refined logout state management to ensure clean redirection after session termination.
- **Admin Feedback**: Added specific error messages for non-verified admin accounts during sign-in.

## [0.1.6] - 2026-01-23
- UI improvements and bug fixes


## [0.1.5] - 2026-01-23
- Order cancellation with mandatory reason


## [0.1.4] - 2026-01-23
### Added
- **Order Cancellation**: Customers can now cancel their Open or Accepted orders with mandatory cancellation reason
  - Predefined cancellation reasons for quick selection
  - Custom reason option for specific cases
  - Cancellation reason displayed on cancelled orders
- **Order Protection**: Cancelled orders cannot be edited or have their status changed

### Changed
- **Admin Orders**: Status dropdown disabled for cancelled orders to prevent accidental modifications


## [0.1.3] - 2026-01-23
### Added
- **Customer Profile Page**: Users can now view and manage their profile details, contact information, and delivery addresses via the navbar dropdown menu.
- **Blog Section**: Added three new informative blog posts:
  - "Organic Slow Farming" - Insights into sustainable farming practices
  - "How Much Protein We Need?" - Nutritional guidance
  - "Better Parenting Tips for Teenagers Parents" - Parenting advice
- **Mobile Category Filter**: Redesigned shop category filter with horizontal scrolling for improved mobile experience.
- **Cart Error Handling**: Added error boundary component for better cart page stability.
- **Checkout Enhancements**: 
  - Added delivery instructions field for customer notes
  - Added expected delivery date/time picker with Nepali date support
  - Made address and contact number fields mandatory
- **Footer Version Display**: Application version now visible in footer.

### Fixed
- **Shop Page State**: Fixed issue where item "Added" status would revert to "Add" when adding other items to cart.
- **Checkout Flow**: Users now remain on checkout page after login instead of being redirected.
- **User Logout**: Resolved logout functionality bug in Navbar authentication flow.
- **Cart Persistence**: Fixed issues where newly placed orders were not appearing in "View Status" or "My Orders" sections.

### Changed
- **Logo Enhancement**: Updated and made application logo more prominent across all pages (Navbar, Footer, Login, Admin).
- **Login Page**: Changed greeting from "Welcome Back" to "Welcome" for better user experience.
- **Shop Page UI**: Added informational note: "Item quantity can be set from the Checkout page."
- **Category Filter**: Moved from sidebar to top-positioned selector for better mobile accessibility.


## [0.1.1] - 2026-01-23
- Fixed logout functionality bug in Navbar where useAuth hook was called incorrectly.
