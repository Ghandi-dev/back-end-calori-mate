import e, { Response } from "express";
import mongoose from "mongoose";

import * as yup from "yup";

type Pagination = {
  totalPages: number;
  current: number;
  total: number;
};

export default {
  success: (res: Response, data: any, message: string) => {
    return res.status(200).json({
      meta: {
        message: message,
        status: 200,
      },
      data,
    });
  },
  error: (res: Response, error: unknown, message: string) => {
    if (error instanceof yup.ValidationError) {
      return res.status(400).json({
        meta: {
          message: message,
          status: 400,
        },
        data: {
          [`${error.path}`]: error.message,
        },
      });
    }
    if (error instanceof mongoose.Error) {
      return res.status(500).json({
        meta: {
          message: error.message,
          status: 500,
        },
        data: error.name,
      });
    }

    if ((error as any)?.code) {
      const _err = error as any;
      return res.status(500).json({
        meta: {
          message: _err.errorResponse.errmsg,
          status: 500,
        },
        data: _err,
      });
    }

    return res.status(500).json({
      meta: {
        message: message,
        status: 500,
      },
      data: error,
    });
  },
  unauthorized: (res: Response, message: string = "Unauthorized") => {
    return res.status(403).json({
      meta: {
        message: message,
        status: 403,
      },
      data: null,
    });
  },
  notFound: (res: Response, message: string = "Not Found") => {
    return res.status(404).json({
      meta: {
        message: message,
        status: 404,
      },
      data: null,
    });
  },
  pagination(res: Response, data: any[], pagination: Pagination, message: string) {
    return res.status(200).json({
      meta: {
        message: message,
        status: 200,
      },
      data,
      pagination,
    });
  },
};
