/**
 * Helper to get pagination parameters from query string
 */
const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.max(1, parseInt(query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Format standard paginated response payload
 */
const formatPaginatedResponse = ({ data, total, page, limit }) => {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        }
    };
};

module.exports = {
    getPaginationParams,
    formatPaginatedResponse
};
