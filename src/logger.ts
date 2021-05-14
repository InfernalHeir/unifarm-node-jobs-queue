import winston from "winston";

export const logger = winston.createLogger({
   transports: [
      new winston.transports.Console({
         level: "info",
         format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.timestamp({ format: "MM-YY-DD hh:mm:ss a" })
         ),
      }),
      new winston.transports.File({
         filename: "./storage/logs/error.log",
         level: "error",
      }),
   ],
   exitOnError: false,
});
