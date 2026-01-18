const handleError = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong!";
  const stack = err.stack || "No stack trace available";
  console.error(`Error: ${message}\nStatus: ${status}\nStack: ${stack}`);
  console.error(err);
  return res.status(status).json({
    success: false,
    status,
    message,
    stack,
  });
};

export default handleError;
