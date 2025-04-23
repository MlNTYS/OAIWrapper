const prisma = require('../prisma');

async function getAvailableModels(req, res, next) {
  try {
    const filter = req.userRole === 'ADMIN' ? {} : { is_enabled: true };
    const models = await prisma.model.findMany({
      where: filter,
      orderBy: { display_order: 'asc' },
      select: { id: true, api_name: true, name: true, cost: true, is_enabled: true, is_inference_model: true, reasoning_effort: true, system_message: true, display_order: true, context_limit: true }
    });
    res.json(models);
  } catch (err) {
    next(err);
  }
}

async function createModel(req, res, next) {
  try {
    const { api_name, name, cost, is_enabled, is_inference_model, reasoning_effort, system_message, display_order, context_limit } = req.body;
    const model = await prisma.model.create({
      data: { api_name, name, cost, is_enabled, is_inference_model, reasoning_effort, system_message, display_order, context_limit }
    });
    res.status(201).json({ id: model.id, api_name: model.api_name, name: model.name, cost: model.cost, is_enabled: model.is_enabled, is_inference_model: model.is_inference_model, reasoning_effort: model.reasoning_effort, system_message: model.system_message, display_order: model.display_order, context_limit: model.context_limit });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'api_name already exists' });
    }
    next(err);
  }
}

async function updateModel(req, res, next) {
  try {
    const { api_name, name, cost, is_enabled, is_inference_model, reasoning_effort, system_message, display_order, context_limit } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (cost !== undefined) data.cost = cost;
    if (api_name !== undefined) data.api_name = api_name;
    if (is_enabled !== undefined) data.is_enabled = is_enabled;
    if (is_inference_model !== undefined) data.is_inference_model = is_inference_model;
    if (reasoning_effort !== undefined) data.reasoning_effort = reasoning_effort;
    if (system_message !== undefined) data.system_message = system_message;
    if (display_order !== undefined) data.display_order = display_order;
    if (context_limit !== undefined) data.context_limit = context_limit;
    const model = await prisma.model.update({
      where: { id: req.params.id },
      data
    });
    res.json({ id: model.id, api_name: model.api_name, name: model.name, cost: model.cost, is_enabled: model.is_enabled, is_inference_model: model.is_inference_model, reasoning_effort: model.reasoning_effort, system_message: model.system_message, display_order: model.display_order, context_limit: model.context_limit });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'api_name already exists' });
    }
    next(err);
  }
}

// 모델 삭제 (ADMIN)
async function deleteModel(req, res, next) {
  try {
    await prisma.model.delete({ where: { id: req.params.id } });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAvailableModels, createModel, updateModel, deleteModel }; 