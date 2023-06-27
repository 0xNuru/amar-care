# syntax=docker/dockerfile:1

# parent image
FROM python:3.9-slim

#working directory in which all comands will be refrenced to 
WORKDIR /app

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt


# COPY source dest
COPY . .

# command to run app in the container
CMD [ "python3", "-m", "flask", "run", "--host=0.0.0.0" ]
