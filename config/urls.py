"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path

from liah import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.index, name='home'),
    path('login/', auth_views.LoginView.as_view(template_name='liah/login.html', redirect_authenticated_user=True), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('painel/', views.painel, name='painel'),
    path('chat/', views.chat, name='chat'),
    path('configuracoes/', views.configuracoes, name='configuracoes'),
    path('api/demo/', views.api_demo, name='api_demo'),
    path('api/chat/', views.api_chat, name='api_chat'),
    path('api/status/', views.api_status, name='api_status'),
    path('api/historico/', views.api_historico, name='api_historico'),
]
