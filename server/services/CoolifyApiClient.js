import axios from "axios";
import { AppError } from "../utils/errorHandler.js";

/**
 * CoolifyApiClient - Coolify API ile iletişim için soyutlanmış HTTP client
 *
 * SOLID Principles:
 * - Single Responsibility: Sadece Coolify API ile HTTP iletişiminden sorumlu
 * - Dependency Inversion: Axios'un soyutlanmış bir interface'i
 * - Open/Closed: Yeni methodlar eklenebilir, mevcut kod değişmeden
 */
class CoolifyApiClient {
  constructor() {
    this.baseURL = process.env.COOLIFY_BASE_URL;
    this.token = process.env.COOLIFY_TOKEN;

    if (!this.baseURL || !this.token) {
      throw new AppError("Coolify configuration not found", 500);
    }

    this.client = axios.create({
      baseURL: `${this.baseURL}/api/v1`,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * GET request to Coolify API
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<any>} Response data
   */
  async get(endpoint) {
    try {
      const response = await this.client.get(endpoint);
      return response.data;
    } catch (error) {
      this._handleError(error, "GET", endpoint);
    }
  }

  /**
   * POST request to Coolify API
   * @param {string} endpoint - API endpoint path
   * @param {object} data - Request body data
   * @returns {Promise<any>} Response data
   */
  async post(endpoint, data = {}) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      this._handleError(error, "POST", endpoint);
    }
  }

  /**
   * DELETE request to Coolify API
   * @param {string} endpoint - API endpoint path
   * @returns {Promise<any>} Response data
   */
  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      this._handleError(error, "DELETE", endpoint);
    }
  }

  /**
   * Centralized error handling
   * @private
   */
  _handleError(error, method, endpoint) {
    const status = error.response?.status;
    let message = error.response?.data?.message;

    if (!message) {
      if (!error.response) {
        // No HTTP response at all: DNS, refused connection, TLS or timeout.
        message = `Cannot reach Coolify at ${this.baseURL} (${error.code || error.message}) while calling ${method} ${endpoint}`;
      } else {
        message = `Coolify answered ${status} to ${method} ${endpoint}`;
      }
    }

    console.error(
      `[coolify] ${method} ${endpoint} failed:`,
      status || error.code || error.message
    );
    throw new AppError(message, status || 502);
  }
}

// Singleton instance
let coolifyClientInstance = null;

/**
 * Get or create Coolify API client instance
 * @returns {CoolifyApiClient}
 */
export const getCoolifyClient = () => {
  if (!coolifyClientInstance) {
    coolifyClientInstance = new CoolifyApiClient();
  }
  return coolifyClientInstance;
};

export default CoolifyApiClient;
