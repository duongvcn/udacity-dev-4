import { TodosAccess } from './todosAcess'
import { AttachmentUtils } from './attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'
import { TodoUpdate } from '../models/TodoUpdate';

const logger = createLogger('todos')
const todosAccess = new TodosAccess()
const attachmentUtils = new AttachmentUtils()

export async function getTodosForUser(userId: string): Promise<TodoItem[]> {
    logger.info("get todo for user", { "userId": userId })
    return await todosAccess.getTodosForUser(userId);
}

export async function createTodo(userId: string, createTodoRequest: CreateTodoRequest): Promise<TodoItem> {
    const todoId = uuid.v4();
    const createdAt = new Date().toISOString();
    const done = false;
    const attachmentUrl = await attachmentUtils.generateUploadUrl(userId, todoId);
    const todoItem: TodoItem = { userId, todoId, createdAt, ...createTodoRequest, done, attachmentUrl };
    logger.info("create todo for user", { "userId": userId, ...createTodoRequest });
    return await todosAccess.createTodo(todoItem);
}

export async function updateTodo(userId: string, todoId: string, updateTodoRequest: UpdateTodoRequest): Promise<void> {
    logger.info("update todo for user", { "userId": userId, ...updateTodoRequest });
    const updateData: TodoUpdate = { ...updateTodoRequest };
    await todosAccess.updateTodo(userId, todoId, updateData);
}

export async function deleteTodo(userId: string, todoId: string): Promise<void> {
    logger.info("delete todo for user", { "userId": userId, "todoId": todoId });
    await todosAccess.deleteTodo(userId, todoId);
}

export async function createAttachmentPresignedUrl(userId: string, todoId: string): Promise<void> {
    logger.info("create AttachmentPresignedUrl", { "userId": userId, "todoId": todoId });
    await attachmentUtils.generateUploadUrl(userId, todoId);
}