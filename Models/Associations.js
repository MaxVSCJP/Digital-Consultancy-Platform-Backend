import User from "./UserModel.js";
import Booking from "./BookingModel.js";
import Availability from "./AvailabilityModel.js";
import Notification from "./NotificationModel.js";

User.hasMany(Booking, { foreignKey: "userId", as: "userBookings" });
Booking.belongsTo(User, { foreignKey: "userId", as: "user" });

User.hasMany(Booking, {
  foreignKey: "consultantId",
  as: "consultantBookings",
});
Booking.belongsTo(User, { foreignKey: "consultantId", as: "consultant" });

User.hasMany(Availability, { foreignKey: "consultantId", as: "availabilities" });
Availability.belongsTo(User, { foreignKey: "consultantId", as: "consultantProfile" });

Availability.hasMany(Booking, { foreignKey: "availabilityId", as: "bookings" });
Booking.belongsTo(Availability, { foreignKey: "availabilityId", as: "availability" });

User.hasMany(Notification, { foreignKey: "recipientId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "recipientId", as: "recipient" });

Booking.hasMany(Notification, { foreignKey: "bookingId", as: "notifications" });
Notification.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });
