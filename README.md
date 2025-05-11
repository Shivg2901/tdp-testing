<!--
This is a markdown file used for documenting things. If you viewing this on a code editor please render this page before reading.
If you are using VS Code, press Ctrl + Shift + V on windows. Cmd + Shift + V for Mac.
For other IDEs, refer to their mannual for enabling markdown rendering feature.
-->

# PDnet Project

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Importing/Exporting Data](#importingexporting-data)
- [More Information](#more-information)
- [Troubleshooting & FAQs](#troubleshooting--faqs)

## Description

This project is for gene analysis purpose. Frontend contains a web interface for graph traversal  
and analysing the gene data. Backend contains the graph traversal algorithm and the gene data.

## Installation

1. Clone the repository

    ```bash
    git clone https://github.com/Crecientech-Pvt-Ltd/tdp-platform.git && cd tdp-platform
    ```

2. Fill environment variables in `.env`, `frontend/.env`  `backend/.env` using the `.env.example` files in their respective directory.

    ```bash
    cp .env.example .env
    cp backend/.env.example backend/.env
    cp frontend/.env.example frontend/.env
    ```

3. **[FOR DEVELOPMENT ONLY]** Install all dependencies in frontend and backend repository. Also, install the dependencies in the root directory to setup git hooks and lint-staging along with commitlinting.

    ```bash
    npm install
    cd frontend && npm install && cd ..
    cd backend && npm install && cd ..
    ```

##### Video Upload
4. Download the video files from the following link and place them inside the [`frontend/public/video`](./frontend/public/video/) folder.

    > [!NOTE]
    > This is not the most conventional & intuitive place to keep the videos, but this was hard-coded in the frontend code, so directed to keep the videos in this folder. This will soon be changed and once done will be updated in the manual. Also, this workflow will be gradually improved to avoid these steps, but currently the video size exceeds 100MB limit of commit size, so this is the workaround.

    [Video Files](https://drive.google.com/drive/folders/1ZnQ7802kUhu9uGyD7rXONvULb4ELSv4l)
    

5. Docker compose up the database and seed the data.
    > 💡 **NOTE**
    > In case, the server doesn't have the dump data. Transfer the files using the following command:
    > ```bash
    > # Transfer files to the server
    > scp -r <source-path> <username>@<server-ip>:<destination-path>/data/backup
    > ```
    > > 💡 **NOTE**  
    > > Replace `<destination-path>` with the path specified in the [docker-compose.yml](../docker-compose.yml) file.
    > > ```yaml
    > > services:
    > >   neo4j:
    > >     ...
    > >     volumes:
    > >       - <destination-path>:/var/lib/neo4j/import
    > > ```
    > > **For this project, by default in [docker-compose.yml](../docker-compose.yml) file, the path to keep the database dump is inside [backup](./scripts/data/backup/) folder.**

    #### Database Load Command
    ```bash
    docker compose up -d neo4j
    docker exec -it neo4j neo4j-admin database load --from-path=/var/lib/neo4j/import/data/backup pdnet
    # Change the username (default username is neo4j) and password
    docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "CREATE DATABASE pdnet; START pdnet;"
    ```

6. For some systems, if you are not the admin user, there may be some restriction in the folder permissions. In such cases, you can change the folder permissions to allow yourself access to the scripts folder.

    ```bash
    # Change the folder permissions (you can have more granular control over this by changing the numbers)
    sudo chmod -R 755 scripts
    ```

7. Once, data is seeded successfully and database is ready. Now restart the neo4j service and start all the services.

    ```bash
    docker compose down neo4j
    docker compose up -d --build
    ```

## More Information

For more information of backend and frontend, refer to the respective README files in the [backend](./backend/README.md) and [frontend](./frontend/README.md) directories.

## Importing/Exporting Data

1. Export the database dump from the database.

    ```bash
    # Dump the database
    docker exec -it neo4j neo4j-admin database dump --overwrite-destination --to-path=/var/lib/neo4j/import/data/backup pdnet 
    ```

  Now, the database dump is available in the [backup](./scripts/data/backup) folder. If there's already a dump file present, it will overwrite it. It's better to rename the existing dump file before exporting the data in case something goes wrong, you do not lose the data. This dump file is now ready to be imported into another database.

2. The database dump can be imported into another database using the following command.

    ```bash
    # First, make the database offline
    docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "STOP DATABASE pdnet;"
    # Now, you can import the database dump
    docker exec -it neo4j neo4j-admin database load --overwrite-destination --from-path=/var/lib/neo4j/import/data/backup pdnet
    # Now, restart the container
    docker compose down neo4j && docker compose up -d neo4j
    # Now, you can start the database
    docker exec -it neo4j cypher-shell -u neo4j -p $NEO4J_PASSWORD "CREATE DATABASE pdnet IF NOT EXISTS; START DATABASE pdnet;"
    ```

    > 💡 **NOTE**  
    > The above command will overwrite the existing database. If you want to keep the existing database, you can create a new database and import the data into that database and then switch to the new database.

3. For ingesting data into the database, refer to the [Scripts Usage Documentation](./scripts/README.md).


## Troubleshooting & FAQs

1. File permissions error in frontend container running leading to unable to view pages on website. This may occur when working on company servers.

    **Fix:**
    ```bash
    docker exec -it frontend chmod -R 755 /usr/share/nginx/html
    ```

2. If you can't access the [`scripts`](./scripts) folder while running the docker container, you can change the folder permissions to allow yourself access to the scripts folder.

    **Fix:**
    ```bash
    # Change the folder permissions (you can have more granular control over this by changing the numbers)
    sudo chmod -R 755 scripts
    ```

3. If Video is not working, please Refer to [this point](#video-upload).