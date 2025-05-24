// controllers/rechargeController.js

const { fetchPlans } = require('../services/planService');
const {fetchPlanType} = require('../services/planService');

const getPlanTypes = async (req, res) => {
    const { op_id, cir_id,plan_type } = req.body;
    
   if(!op_id || !cir_id){
      return res.status(400).send('This field is mandatory')
   }
    try {
      // Fetch recharge plans using the service
      const plans = await fetchPlanType(op_id, cir_id, plan_type);
      //console.log(plans);
      if(!plans){
          res.status(400).send('No plan found')
      }
      return res.status(200).json({
        success: true,
        data: {
          plans: plans,
        },
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: {
          code: '103',
          text: 'Recharge plans not available for the specified operator, circle.',
        },
      });
    }
  };

const getPlans = async (req, res) => {
  const { op_id, cir_id } = req.body;
 if(!op_id || !cir_id){
    return res.status(400).send('This field is mandatory')
 }
  try {
    // Fetch recharge plans using the service
    const plans = await fetchPlans(op_id, cir_id);
    if(!plans){
        res.status(400).send('No plan found')
    }
    return res.status(200).json({
      success: true,
      data: {
        plans: plans,
      },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: {
        code: '103',
        text: 'Recharge plans not available for the specified operator, circle.',
      },
    });
  }
};

module.exports = { getPlans, getPlanTypes };
