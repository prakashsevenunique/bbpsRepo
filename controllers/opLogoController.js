const {operatorLogoService} = require("../services/OpLogoService");

const operatorLogo = async (req, res) => {
    try {
       const {op_id} = req.body;

        const response = await operatorLogoService({op_id});
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message || "Unknown error"
        });
    }
};

module.exports = {operatorLogo};