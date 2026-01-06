export const checkRole = (userRole: string | undefined, targetRole: string): boolean => {
    if (!userRole) return false;
    return userRole.toUpperCase() === targetRole.toUpperCase();
};
