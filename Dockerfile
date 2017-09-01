FROM fedora:latest

MAINTAINER Gerry Casey <gerard.casey@arup.com>

# Libraries
RUN dnf update -y && dnf install -y git curl npm nodejs wget
RUN  npm install -g yarn && yarn global add n && n stable

# purescript and elm
RUN yarn global add purescript elm@0.16

# Expose port
EXPOSE 4000 3000

WORKDIR /root
RUN mkdir sierra-charlie

# Get the code
COPY . /root/sierra-charlie

WORKDIR sierra-charlie

RUN yarn install --no-optional
RUN npm run build
RUN npm run start-proxy&

CMD npm start
