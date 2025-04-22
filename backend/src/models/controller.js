const prisma = require('../prisma');

async function getAvailableModels(req, res, next) {
  try {
    const filter = req.userRole === 'ADMIN' ? {} : { is_enabled: true };
    const models = await prisma.model.findMany({
      where: filter,
      select: { id: true, api_name: true, name: true, cost: true, is_enabled: true, is_inference_model: true, reasoning_effort: true, system_message: true }
    });
    res.json(models);
  } catch (err) {
    next(err);
  }
}

async function createModel(req, res, next) {
  try {
    const { api_name, name, cost, is_enabled, is_inference_model, reasoning_effort, system_message } = req.body;
    const model = await prisma.model.create({
      data: { api_name, name, cost, is_enabled, is_inference_model, reasoning_effort, system_message }
    });
    res.status(201).json({ id: model.id, api_name: model.api_name, name: model.name, cost: model.cost, is_enabled: model.is_enabled, is_inference_model: model.is_inference_model, reasoning_effort: model.reasoning_effort, system_message: model.system_message });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'api_name already exists' });
    }
    next(err);
  }
}

async function updateModel(req, res, next) {
  try {
    const { api_name, name, cost, is_enabled, is_inference_model, reasoning_effort, system_message } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (cost !== undefined) data.cost = cost;
    if (api_name !== undefined) data.api_name = api_name;
    if (is_enabled !== undefined) data.is_enabled = is_enabled;
    if (is_inference_model !== undefined) data.is_inference_model = is_inference_model;
    if (reasoning_effort !== undefined) data.reasoning_effort = reasoning_effort;
    if (system_message !== undefined) data.system_message = system_message;
    const model = await prisma.model.update({
      where: { id: req.params.id },
      data
    });
    res.json({ id: model.id, api_name: model.api_name, name: model.name, cost: model.cost, is_enabled: model.is_enabled, is_inference_model: model.is_inference_model, reasoning_effort: model.reasoning_effort, system_message: model.system_message });
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