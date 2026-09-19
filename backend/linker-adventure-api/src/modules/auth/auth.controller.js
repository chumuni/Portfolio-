import * as authService from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok, created } from '../../utils/respond.js';

const agent = (req) => req.get('user-agent') ?? null;

export const registerCompany = asyncHandler(async (req, res) =>
  created(res, await authService.registerCompany(req.body, agent(req), req.file)));

export const registerAgent = asyncHandler(async (req, res) =>
  created(res, await authService.registerAgent(req.body, agent(req), req.file)));

export const login = asyncHandler(async (req, res) =>
  ok(res, await authService.login(req.body, agent(req))));

export const refresh = asyncHandler(async (req, res) =>
  ok(res, await authService.refresh(req.body, agent(req))));

export const logout = asyncHandler(async (req, res) =>
  ok(res, await authService.logout(req.body ?? {})));

export const changePassword = asyncHandler(async (req, res) =>
  ok(res, await authService.changePassword(req.user.id, req.body)));

export const me = asyncHandler(async (req, res) =>
  ok(res, await authService.currentUser(req.user)));
