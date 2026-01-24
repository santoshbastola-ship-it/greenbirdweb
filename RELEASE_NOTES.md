# Release Notes

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

