// Citizens report an issue: text fields, a map pin, and up to 3 photos,
// submitted as multipart/form-data. The department is never chosen here —
// the backend derives it from the category (the auto-routing link), which is
// why the category list is grouped by department for context only.

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FormField from '../components/FormField';
import LocationPicker from '../components/LocationPicker';
import ImagePicker from '../components/ImagePicker';
import { useAuth } from '../context/AuthContext';
import * as categoryApi from '../api/categoryApi';
import * as issueApi from '../api/issueApi';
import { reportIssueSchema } from '../validation/issueSchemas';
import '../components/forms.css';
import './ReportIssuePage.css';

function ReportIssueForm() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoriesState, setCategoriesState] = useState('loading'); // loading | ready | failed
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(reportIssueSchema),
    defaultValues: { title: '', category: '', description: '', address: '', images: [] },
  });

  useEffect(() => {
    categoryApi
      .getCategories()
      .then((res) => {
        setCategories(res.data);
        setCategoriesState('ready');
      })
      .catch(() => setCategoriesState('failed'));
  }, []);

  const groups = useMemo(() => {
    const byDepartment = new Map();
    categories.forEach((category) => {
      const name = category.department?.name || 'Other';
      if (!byDepartment.has(name)) byDepartment.set(name, []);
      byDepartment.get(name).push(category);
    });
    return [...byDepartment.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [categories]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const res = await issueApi.createIssue(values);
      navigate(`/issues/${res.data._id}`);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Could not submit your report. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <section className="report-section">
        <h2>What's the problem?</h2>
        <FormField id="title" label="Title" type="text" maxLength={120} error={errors.title} {...register('title')} />
        <FormField as="select" id="category" label="Category" error={errors.category} {...register('category')}>
          <option value="">
            {categoriesState === 'loading' ? 'Loading categories…' : 'Select a category'}
          </option>
          {groups.map(([departmentName, items]) => (
            <optgroup key={departmentName} label={departmentName}>
              {items.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </optgroup>
          ))}
        </FormField>
        {categoriesState === 'failed' && (
          <p className="field-error">Could not load categories. Refresh the page to try again.</p>
        )}
        <FormField
          as="textarea"
          id="description"
          label="Description"
          rows={5}
          maxLength={1000}
          error={errors.description}
          {...register('description')}
        />
      </section>

      <section className="report-section">
        <h2>Where is it?</h2>
        <Controller
          name="location"
          control={control}
          render={({ field }) => <LocationPicker value={field.value} onChange={field.onChange} error={errors.location} />}
        />
        <FormField
          id="address"
          label="Address or landmark (optional)"
          type="text"
          maxLength={300}
          error={errors.address}
          {...register('address')}
        />
      </section>

      <section className="report-section">
        <h2>Photos</h2>
        <Controller
          name="images"
          control={control}
          render={({ field }) => <ImagePicker value={field.value} onChange={field.onChange} error={errors.images} />}
        />
      </section>

      <div className="report-submit">
        {serverError && (
          <div className="form-banner-error" role="alert">
            {serverError}
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting…' : 'Submit report'}
        </button>
        {isSubmitting && <p className="report-note">Uploading photos can take a few seconds.</p>}
      </div>
    </form>
  );
}

export default function ReportIssuePage() {
  const { user } = useAuth();
  const isCitizen = user?.role === 'citizen';

  return (
    <div className="report-shell">
      <Navbar />
      <div className="report-content">
        <h1>Report an issue</h1>
        {isCitizen ? (
          <>
            <p className="report-intro">
              Describe the problem, pin where it is, and add photos if you have them. It is sent to the
              responsible department automatically, based on the category you choose.
            </p>
            <ReportIssueForm />
          </>
        ) : (
          <p className="report-blocked">
            Only citizen accounts can report issues, and you're signed in as{' '}
            {user?.role?.replace('_', ' ')}. <Link to="/">Back to the feed</Link>
          </p>
        )}
      </div>
    </div>
  );
}
