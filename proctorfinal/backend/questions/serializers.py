from rest_framework import serializers
from .models import Question, Choice, Answer

class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Choice
        fields = ("id","text","is_correct")

class ChoicePublicSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Choice
        fields = ("id","text")

class QuestionAdminSerializer(serializers.ModelSerializer):
    choices = ChoiceSerializer(many=True, read_only=True)
    class Meta:
        model  = Question
        fields = ("id","exam","text","qtype","marks","order","model_answer","choices")
        read_only_fields = ("id",)

class QuestionStudentSerializer(serializers.ModelSerializer):
    choices = ChoicePublicSerializer(many=True, read_only=True)
    class Meta:
        model  = Question
        fields = ("id","text","qtype","marks","order","choices")

class ChoiceInlineSerializer(serializers.Serializer):
    text       = serializers.CharField()
    is_correct = serializers.BooleanField(default=False)

class QuestionCreateSerializer(serializers.ModelSerializer):
    choices = ChoiceInlineSerializer(many=True, required=False)
    class Meta:
        model  = Question
        fields = ("exam","text","qtype","marks","order","model_answer","choices")
    def create(self, validated_data):
        choices_data = validated_data.pop("choices",[])
        q = Question.objects.create(**validated_data)
        for c in choices_data: Choice.objects.create(question=q,**c)
        return q
    def update(self, instance, validated_data):
        choices_data = validated_data.pop("choices",None)
        for attr,val in validated_data.items(): setattr(instance,attr,val)
        instance.save()
        if choices_data is not None:
            instance.choices.all().delete()
            for c in choices_data: Choice.objects.create(question=instance,**c)
        return instance

class AnswerSerializer(serializers.ModelSerializer):
    student_name   = serializers.CharField(source="attempt.user.name",     read_only=True)
    student_email  = serializers.CharField(source="attempt.user.email",    read_only=True)
    question_text  = serializers.CharField(source="question.text",         read_only=True)
    question_type  = serializers.CharField(source="question.qtype",        read_only=True)
    question_marks = serializers.IntegerField(source="question.marks",     read_only=True)
    model_answer   = serializers.CharField(source="question.model_answer", read_only=True)
    selected_text  = serializers.CharField(source="selected.text",         read_only=True)
    correct_answer = serializers.SerializerMethodField()
    class Meta:
        model  = Answer
        fields = ("id","attempt","question","question_text","question_type","question_marks",
                  "model_answer","student_name","student_email","selected","selected_text",
                  "text_answer","is_correct","marks_obtained","graded_by_admin","correct_answer","answered_at")
    def get_correct_answer(self, obj):
        c = obj.question.choices.filter(is_correct=True).first()
        return c.text if c else None

class AnswerSubmitSerializer(serializers.Serializer):
    attempt_id  = serializers.IntegerField()
    question_id = serializers.IntegerField()
    choice_id   = serializers.IntegerField(required=False, allow_null=True)
    text_answer = serializers.CharField(required=False, allow_blank=True)

class AdminGradeSerializer(serializers.Serializer):
    answer_id  = serializers.IntegerField()
    marks      = serializers.FloatField(min_value=0)
    is_correct = serializers.BooleanField(required=False, allow_null=True)
