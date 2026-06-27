import app from "./app";
import { env } from "./config/env";

// Start Express server
const server = app.listen(env.PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

export default server;
