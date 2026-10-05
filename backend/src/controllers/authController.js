import { authService } from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    return successResponse(res, {
      statusCode: 200,
      message: 'Authentication successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const profile = await authService.getProfile(req.user._id);
    return successResponse(res, { data: profile });
  } catch (error) {
    next(error);
  }
}

export async function createClient(req, res, next) {
  try {
    const client = await authService.createClient(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'Client created successfully',
      data: client,
    });
  } catch (error) {
    next(error);
  }
}

export async function listClients(req, res, next) {
  try {
    const clients = await authService.listClients();
    return successResponse(res, { data: clients });
  } catch (error) {
    next(error);
  }
}

export default {
  login,
  getMe,
  createClient,
  listClients,
};
