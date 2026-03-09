
export const RoleValidationSchema = (json) => {



  const MyPromiss = new Promise((resolve, reject) => {
    var errorJson = {};

    if (!json?.role || !json.role.trim()) {
      Object.assign(errorJson, { role: "Role name can't be empty *" });
    }
    if (!json?.roleType || !json.roleType.trim()) {
      Object.assign(errorJson, { roleType: "Role type is required *" });
    }

    resolve(errorJson);
  });

  return MyPromiss;
};
