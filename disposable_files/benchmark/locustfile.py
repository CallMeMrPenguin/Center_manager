import time
import random
from locust import HttpUser, task, between

class CenterManagerActiveUser(HttpUser):
    """
    Simulates a realistic active user (teacher / student / admin)
    browsing Center Manager App with human think-time (1 to 3 seconds).
    """
    wait_time = between(1.0, 3.0)

    @task(4)
    def view_students(self):
        """Simulate loading student list"""
        self.client.get("/api/students", name="/api/students")

    @task(3)
    def view_classes(self):
        """Simulate viewing classes list"""
        self.client.get("/api/classes", name="/api/classes")

    @task(2)
    def view_teachers(self):
        """Simulate viewing teachers list"""
        self.client.get("/api/teachers", name="/api/teachers")

    @task(2)
    def view_courses(self):
        """Simulate checking courses list"""
        self.client.get("/api/courses", name="/api/courses")

    @task(1)
    def check_system_version(self):
        """Simulate periodic client heartbeat / version poll"""
        self.client.get("/api/system/version", name="/api/system/version")

    @task(1)
    def view_frontend_app(self):
        """Simulate initial page load / refresh"""
        self.client.get("/", name="Frontend Index")
