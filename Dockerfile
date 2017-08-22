FROM fedora

MAINTAINER Gerry Casey <gerard.casey@arup.com>

# Libraries
RUN dnf update -y
RUN dnf install git curl wget -y 
RUN dnf install npm nodejs -y
RUN npm install -g n
RUN n stable

# NPM stuff
RUN npm install -g purescript
RUN npm install -g elm@0.16

WORKDIR /root

# Expose port
EXPOSE 4000 3000

# Get the code
COPY sierra-charlie

WORKDIR sierra-charlie

RUN npm install --no-optional
RUN npm run build
RUN npm run start-proxy&

# RUN npm start