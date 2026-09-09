import { EmployeeService } from './employeeService';
import { ClientService } from './clientService';
import { ProjectService } from './projectService';
import { EmployeeProfile, ProjectDetail, ProjectWithClient, ClientProfile, RateHistoryRecord } from './registryTypes';

export * from './registryTypes';
export * from './employeeService';
export * from './clientService';
export * from './projectService';

export class RegistryService {
  // Employee methods
  static getEmployees = EmployeeService.getEmployees;
  static getNextEmployeeId = EmployeeService.getNextEmployeeId;
  static createEmployee = EmployeeService.createEmployee;
  static updateEmployee = EmployeeService.updateEmployee;

  // Client methods
  static getClients = ClientService.getClients;
  static getNextClientId = ClientService.getNextClientId;
  static createClient = ClientService.createClient;
  static updateClient = ClientService.updateClient;

  // Project methods
  static getAllProjects = ProjectService.getAllProjects;
  static getNextProjectId = ProjectService.getNextProjectId;
  static createProject = ProjectService.createProject;
  static updateProject = ProjectService.updateProject;
  static getRateHistory = ProjectService.getRateHistory;
}
