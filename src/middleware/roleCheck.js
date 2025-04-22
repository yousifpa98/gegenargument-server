export const roleCheck = (targetRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.roles) {
        return res.status(403).json({ message: "Access Denied." });
      }

      const userRoles = Array.isArray(req.user.roles)
        ? req.user.roles
        : [req.user.roles];

      const allowedRoles = Array.isArray(targetRoles)
        ? targetRoles
        : [targetRoles];

      const hasPermission = userRoles.some((role) =>
        allowedRoles.includes(role),
      );

      if (!hasPermission) {
        return res.status(403).json({ message: "Access Denied." });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };
};
