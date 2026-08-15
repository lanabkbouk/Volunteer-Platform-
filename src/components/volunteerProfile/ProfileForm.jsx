import { useFormContext, Controller } from "react-hook-form";
import { MapPin, User2, GraduationCap } from "lucide-react";

import Input from "../ui/Input";
import Dropdown from "../ui/Dropdown";
import Textarea from "../ui/Textarea";
import Button from "../ui/Button";
import Typography from "../ui/Typography";
import SkillsSelector from "../common/SkillsSelector";

const GENDER_ITEMS = [
  { name: "Female", value: "Female" },
  { name: "Male", value: "Male" },
];

const EDUCATION_LEVEL_ITEMS = [
  { name: "No Formal Education", value: "No Formal Education" },
  { name: "High School", value: "High School" },
  { name: "Diploma", value: "Diploma" },
  { name: "Bachelor's Degree", value: "Bachelor's Degree" },
];

const GOVERNORATE_ITEMS = [
  "Damascus",
  "Rif Dimashq (Damascus Countryside)",
  "Aleppo",
  "Homs",
  "Hama",
  "Latakia",
  "Tartus",
  "Idlib",
  "Raqqa",
  "Deir ez-Zor",
  "Al-Hasakah",
  "Daraa",
  "As-Suwayda",
  "Quneitra",
].map((name) => ({ name, value: name.startsWith("Rif Dimashq") ? "Rif Dimashq" : name }));

export default function ProfileForm({ submitting, availableSkills = [], skillsLoading = false }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-7">

      {/* ===========================
          Basic Info
      ============================ */}
      <Typography variant="h3" gutterBottom>
        Basic Information
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Controller
          name="educationLevel"
          control={control}
          defaultValue=""
          render={({ field: { value, onChange } }) => (
            <Dropdown
              label="Education Level"
              items={EDUCATION_LEVEL_ITEMS}
              value={value}
              onChange={onChange}
              placeholder="Select your education level"
              icon={GraduationCap}
              error={errors.educationLevel?.message}
            />
          )}
        />

        <Input
          label="Date of Birth"
          name="dateOfBirth"
          type="date"
          register={register}
          variant="filled"
          error={errors.dateOfBirth?.message}
          fullWidth
        />

        {/* Gender */}
        <Controller
          name="gender"
          control={control}
          defaultValue=""
          render={({ field: { value, onChange } }) => (
            <Dropdown
              label="Your Gender"
              items={GENDER_ITEMS}
              value={value}
              onChange={onChange}
              placeholder="Select your gender"
              icon={User2}
              error={errors.gender?.message}
            />
          )}
        />

        {/* Governorate */}
        <Controller
          name="city"
          control={control}
          defaultValue=""
          render={({ field: { value, onChange } }) => (
            <Dropdown
              label="Governorate of Residence"
              items={GOVERNORATE_ITEMS}
              value={value}
              onChange={onChange}
              placeholder="Choose your governorate"
              icon={MapPin}
              error={errors.city?.message}
            />
          )}
        />
      </div>

      {/* ===========================
          Skills Section
      ============================ */}
      <Typography variant="h3" gutterBottom>
        Skills
      </Typography>

      <SkillsSelector
        control={control}
        name="skills"
        availableSkills={availableSkills}
        loading={skillsLoading}
        error={errors.skills?.message}
      />

      {/* Interests */}
      <Input
        label="Interests"
        name="interests"
        register={register}
        placeholder="Comma separated (e.g. Education, Medical Aid)"
        variant="filled"
        fullWidth
      />

      {/* About */}
      <Textarea
        label="About"
        name="about"
        rows={5}
        register={register}
        placeholder="Write a short intro about yourself..."
      />

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
        <Button type="submit" isLoading={submitting}>
          {submitting ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}