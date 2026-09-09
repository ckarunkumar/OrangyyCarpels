"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryService = void 0;
const employeeService_1 = require("./employeeService");
const clientService_1 = require("./clientService");
const projectService_1 = require("./projectService");
__exportStar(require("./registryTypes"), exports);
__exportStar(require("./employeeService"), exports);
__exportStar(require("./clientService"), exports);
__exportStar(require("./projectService"), exports);
class RegistryService {
    // Employee methods
    static getEmployees = employeeService_1.EmployeeService.getEmployees;
    static getNextEmployeeId = employeeService_1.EmployeeService.getNextEmployeeId;
    static createEmployee = employeeService_1.EmployeeService.createEmployee;
    static updateEmployee = employeeService_1.EmployeeService.updateEmployee;
    // Client methods
    static getClients = clientService_1.ClientService.getClients;
    static getNextClientId = clientService_1.ClientService.getNextClientId;
    static createClient = clientService_1.ClientService.createClient;
    static updateClient = clientService_1.ClientService.updateClient;
    // Project methods
    static getAllProjects = projectService_1.ProjectService.getAllProjects;
    static getNextProjectId = projectService_1.ProjectService.getNextProjectId;
    static createProject = projectService_1.ProjectService.createProject;
    static updateProject = projectService_1.ProjectService.updateProject;
    static getRateHistory = projectService_1.ProjectService.getRateHistory;
}
exports.RegistryService = RegistryService;
