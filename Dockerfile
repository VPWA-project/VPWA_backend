# ----- BUILD STAGE -----
FROM node:lts as build-stage

# Aliases setup for container folders
ARG SERVER="/slek-server"
ARG SERVER_SRC="."
ARG BUILD="/slek-server/build"
ENV PORTS="3333"

# Set the working directory inside the container to server module
WORKDIR ${SERVER}

COPY ${SERVER_SRC}/package*.json ./
COPY ${SERVER_SRC}/yarn* ./

RUN yarn

# Copy server module
COPY ${SERVER_SRC} ${SERVER}

# Build TS files
RUN node ace build --production --ignore-ts-errors

# ----- PRODUCTION STAGE -----
FROM node:lts as production-stage

ARG SERVER='/app'
ARG BUILD='/slek-server/build'

WORKDIR ${SERVER}

COPY --from=build-stage ${BUILD} ./

# Install production dependencies
RUN yarn --prod

# Expose port outside container
EXPOSE ${PORTS}

CMD [ "node", "server.js" ]