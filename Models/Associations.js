import User from "./UserModel.js";
import Booking from "./BookingModel.js";
import Availability from "./AvailabilityModel.js";
import Notification from "./NotificationModel.js";
import ChatThread from "./ChatThreadModel.js";
import ChatMessage from "./ChatMessageModel.js";
import Goal from "./GoalModel.js";
import Task from "./TaskModel.js";
import UserGoal from "./UserGoalModel.js";
import UserTaskProgress from "./UserTaskProgressModel.js";


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

User.hasMany(ChatThread, { foreignKey: "userId", as: "chatThreads" });
ChatThread.belongsTo(User, { foreignKey: "userId", as: "user" });

ChatThread.hasMany(ChatMessage, { foreignKey: "threadId", as: "messages" });
ChatMessage.belongsTo(ChatThread, { foreignKey: "threadId", as: "thread" });

Goal.hasMany(Task, { foreignKey: "goalId", onDelete: "CASCADE" });
Task.belongsTo(Goal, { foreignKey: "goalId" });

User.belongsToMany(Goal, { through: UserGoal, foreignKey: "userId" });
Goal.belongsToMany(User, { through: UserGoal, foreignKey: "goalId" });
UserGoal.belongsTo(Goal, {foreignKey: "goalId"});

Goal.hasMany(UserGoal, {foreignKey: "goalId"});
UserGoal.belongsTo(User, {foreignKey: "userId",});

User.hasMany(UserGoal, {foreignKey: "userId",});

UserGoal.hasMany(UserTaskProgress, { foreignKey: "userGoalId" });
UserTaskProgress.belongsTo(UserGoal, { foreignKey: "userGoalId" });


Task.hasMany(UserTaskProgress, { foreignKey: "taskId" });
UserTaskProgress.belongsTo(Task, { foreignKey: "taskId" });
