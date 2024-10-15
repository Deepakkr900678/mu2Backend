export const AdminRoute = (req, res, next) => {
  const userInfo = req.decoded;

  try {
    if (userInfo.type === "Admin") {
      // If user is admin, allow access and call the next middleware
      next();
    } else {
      // If user is not admin, send a 401 Unauthorized response
      return res.status(401).json({ Error: "Authorization Failed" });
    }
  } catch (error) {
    // Handle other errors
    console.error("Error in AdminRoute middleware:", error);
    res.status(500).json({ Error: "Internal Server Error" });
  }
};

export const AdminOrWardenOrSecurity = (req, res, next) => {
  if (
    req.decoded.type === "Admin" ||
    req.decoded.type === "Warden" ||
    req.decoded.type === "Security"
  ) {
    next();
  } else {
    return res.status(401).json({ Error: "Authorization Failed" });
  }
};

export const AdminOrWardenOrSecurityorStudent = (req, res, next) => {
  if (
    req.decoded.type === "Admin" ||
    req.decoded.type === "Warden" ||
    req.decoded.type === "Security" ||
    req.decoded.type === "Student"
  ) {
    next();
  } else {
    return res.status(401).json({ Error: "Authorization Failed" });
  }
};

export const AdminOrWarden = (req, res, next) => {
  if (req.decoded.type === "Admin" || req.decoded.type === "Warden") {
    next();
  } else {
    return res.status(401).json({ Error: "Authorization Failed" });
  }
};
export const WardenOrSecurity = (req, res, next) => {
  if (req.decoded.type === "Warden" || req.decoded.type === "Security") {
    next();
  } else {
    return res.status(401).json({ Error: "Authorization Failed" });
  }
};

export const AdminOrSecurity = (req, res, next) => {
  if (req.decoded.type === "Admin" || req.decoded.type === "Security") {
    next();
  } else {
    return res.status(401).json({ Error: "Authorization Failed" });
  }
};

export const Student = (req, res, next) => {
  if (req.decoded.type === "Student") {
    next();
  } else {
    return res.status(401).json({ Error: "Authorization Failed" });
  }
};
