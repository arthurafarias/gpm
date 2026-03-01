# GPM - Git Like Project Management

## Overview

**GPM** (Git Like Project Management) is a web-based tool designed to help you manage your projects using concepts and workflows inspired by Git. With GPM, teams can create, track, and manage project tasks, milestones, and workflows in a simple, version-controlled manner. Perfect for teams familiar with Git who want to extend that model into project management practices.

Demo: [https://arthurafarias.github.io/gpm/public/](https://arthurafarias.github.io/gpm/public/)

---

## Features

* **Version Control for Projects**: Track changes, create branches, and manage milestones just like you would with Git.
* **Task Tracking**: Easily create, update, and assign tasks to team members.
* **Milestone Management**: Group related tasks into milestones and track progress over time.
* **Branching System**: Create separate “branches” for different aspects of a project (e.g., features, bugs, experiments) to manage parallel development and testing.
* **Merge Requests**: Review and merge tasks from different branches back into the main project timeline.
* **Commit History**: Keep a full history of your project's development with commit logs and changelogs.
* **Collaboration**: Enable your team to work together in a clear and structured way, with task assignments and status updates.

---

## Installation

### Prerequisites

Ensure you have `Node.js` and `npm` installed. You can download Node.js [here](https://nodejs.org/).

### Clone the repository

```bash
git clone https://github.com/arthurafarias/gpm.git
cd gpm
```

### Install dependencies

```bash
npm install
```

### Setup SSL (Optional)

If you want to serve the app over HTTPS, you will need a valid SSL certificate and private key. You can generate them as shown below:

```bash
mkdir -p secure
openssl req -newkey rsa:2048 -nodes -keyout secure/private.key -x509 -out secure/certificate.crt -days 365
```

---

## Running the Application

### Start the application without SSL

To run the application in development mode (HTTP):

```bash
npm run serve
```

This will start a local server at [http://localhost:8080](http://localhost:8080).

### Start the application with SSL (HTTPS)

To run the application over HTTPS (using your SSL certificate and private key):

```bash
npm run serve-secure
```

This will start a secure server at [https://localhost:8080](https://localhost:8080).

---

## Usage

### 1. **Create a New Project**

To start managing a new project, use the following command:

```bash
gpm init <project-name>
```

This will set up a new project with Git-like management capabilities.

### 2. **Create Tasks**

Tasks are the fundamental units of work in GPM. To create a new task:

```bash
gpm task create <task-name>
```

You can also assign tasks to team members:

```bash
gpm task assign <task-name> --assignee <username>
```

### 3. **Branching and Managing Milestones**

Just like Git branches, you can create branches to track different aspects of the project:

```bash
gpm branch create <branch-name>
```

To merge branches back into the main project:

```bash
gpm merge <branch-name>
```

### 4. **Track Progress**

You can check the status of your project by listing all tasks and milestones:

```bash
gpm status
```

This will show you the progress of each task and milestone, including whether they’re completed or still in progress.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Roadmap

* [ ] Add integration with popular Git platforms (GitHub, GitLab, Bitbucket)
* [ ] Add a web-based interface for easier management
* [ ] Implement advanced permissions and access control
* [ ] Automate task status updates with CI/CD pipelines
* [ ] Add reporting and analytics features

---

## Contact

For questions or support, feel free to reach out via [email@example.com](mailto:email@example.com).

---

## package.json Overview

Here’s a quick look at the key parts of the `package.json` file for GPM:

* **Dependencies**: Contains libraries and packages required to run the app, like `http-server`, `chalk`, `async`, and others.
* **Scripts**:

  * `serve`: Starts the app on HTTP.
  * `serve-secure`: Starts the app on HTTPS using the certificates in the `secure/` folder.

Make sure to install the necessary dependencies with `npm install`.