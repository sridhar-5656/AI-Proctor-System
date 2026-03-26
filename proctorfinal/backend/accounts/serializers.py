from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)
    class Meta:
        model  = User
        fields = ("name","email","password","password2","role")
    def validate(self, attrs):
        if attrs["password"] != attrs.get("password2"):
            raise serializers.ValidationError({"password":"Passwords do not match."})
        attrs.pop("password2", None)
        return attrs
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ("id","name","email","role","date_joined")

class CustomTokenSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["name"]  = user.name
        token["email"] = user.email
        token["role"]  = user.role
        return token
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
