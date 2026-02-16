from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')
        
        
        
from .models import (
    LearningProfile, Concept, TeachingAtom, 
    Question, StudentProgress, LearningSession
)

class ConceptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Concept
        fields = ['id', 'name', 'subject', 'description', 'difficulty', 'order']

class TeachingAtomSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeachingAtom
        fields = ['id', 'name', 'explanation', 'analogy', 'examples', 'order']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'difficulty', 'cognitive_operation', 'estimated_time', 
                 'question_text', 'options', 'correct_index']

class StudentProgressSerializer(serializers.ModelSerializer):
    atom_name = serializers.CharField(source='atom.name', read_only=True)
    concept_name = serializers.CharField(source='atom.concept.name', read_only=True)
    
    class Meta:
        model = StudentProgress
        fields = ['id', 'atom_name', 'concept_name', 'mastery_score', 'phase', 
                 'streak', 'hint_usage', 'retention_verified']

class LearningSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningSession
        fields = ['id', 'concept', 'start_time', 'end_time', 'questions_answered',
                 'correct_answers', 'hints_used']