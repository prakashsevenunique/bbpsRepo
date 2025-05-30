const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController.js');
const authenticateToken = require('../middleware/verifyToken.js');
const authorizeRoles = require('../middleware/verifyRole.js');
const { Joi, Segments, celebrate } = require('celebrate');

const serviceSchema = {
    [Segments.BODY]: Joi.object().keys({
        name: Joi.string().trim().required(),
        description: Joi.string().allow('').optional(),
        icon: Joi.string().required(),
        serviceFor: Joi.array()
            .items(Joi.string().valid('User', 'Retailer', 'Distributor', 'ApiPartner', 'Admin'))
            .required(),
        serviceCharges: Joi.number().min(0).required(),
        commission: Joi.number().min(0).required(),
        distributorCommission: Joi.number().min(0).required(),
        gst: Joi.number().min(0).required(),
        isActive: Joi.boolean().optional(),
    }).unknown(true)
};

router.post('/', celebrate(serviceSchema), authenticateToken, authorizeRoles('Admin'), serviceController.createService);
router.get('/', authenticateToken, authorizeRoles('Admin'), serviceController.getAllServices);
router.get('/:id', authenticateToken, authorizeRoles('Admin'), serviceController.getServiceById);
router.put('/:id', celebrate(serviceSchema), authenticateToken, authorizeRoles('Admin'), serviceController.updateService);
router.delete('/:id', authenticateToken, authorizeRoles('Admin'), serviceController.deleteService);
// router.get('/analytics', authenticateToken, authorizeRoles('Admin'), serviceController.getAverageChargesPerRole);

module.exports = router;