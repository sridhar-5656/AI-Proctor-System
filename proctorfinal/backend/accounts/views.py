from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import RegisterSerializer, UserSerializer, CustomTokenSerializer
from .permissions import IsAdmin

class RegisterView(generics.CreateAPIView):
    serializer_class   = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    def create(self, request, *args, **kwargs):
        s = self.get_serializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        return Response({"message":"Registered successfully.","user":UserSerializer(user).data}, status=201)

class LoginView(TokenObtainPairView):
    serializer_class   = CustomTokenSerializer
    permission_classes = [permissions.AllowAny]

class LogoutView(APIView):
    def post(self, request):
        try:
            RefreshToken(request.data.get("refresh")).blacklist()
            return Response({"message":"Logged out."})
        except:
            return Response({"error":"Invalid token."}, status=400)

class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    queryset           = User.objects.filter(role="student").order_by("-date_joined")
    serializer_class   = UserSerializer
    permission_classes = [IsAdmin]
