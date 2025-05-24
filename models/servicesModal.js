const serviceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            default: '',
        },
        icon: {
            type: String,
            required: true,
        },
        serviceFor: [
            {
                type: String,
                enum: ['User', 'Retailer', 'Distributor', 'Admin'],
                required: true,
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);
