const prisma = require('../prisma');

async function getAvailableModels(req, res, next) {
  try {
    const models = await prisma.model.findMany({
      where: { is_enabled: true },
      select: { id: true, api_name: true, name: true, cost: true }
    });
    res.json(models);
  } catch (err) {
    next(err);
  }
}

async function createModel(req, res, next) {
  try {
    const { api_name, name, cost, is_enabled } = req.body;
    const model = await prisma.model.create({
      data: { api_name, name, cost, is_enabled }
    });
    res.status(201).json({ id: model.id, api_name: model.api_name, name: model.name, cost: model.cost, is_enabled: model.is_enabled });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'api_name already exists' });
    }
    next(err);
  }
}

async function updateModel(req, res, next) {
  try {
    const { api_name, name, cost, is_enabled } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (cost !== undefined) data.cost = cost;
    if (api_name !== undefined) data.api_name = api_name;
    if (is_enabled !== undefined) data.is_enabled = is_enabled;
    const model = await prisma.model.update({
      where: { id: req.params.id },
      data
    });
    res.json({ id: model.id, api_name: model.api_name, name: model.name, cost: model.cost, is_enabled: model.is_enabled });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'api_name already exists' });
    }
    next(err);
  }
}

module.exports = { getAvailableModels, createModel, updateModel }; 